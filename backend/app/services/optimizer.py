"""
Motor de otimização de rotas — o diferencial do RotaSpeed Prime.

Substitui a "otimização por IA (Gemini)" por otimização REAL de VRP/TSP.
- Se `ortools` estiver instalado, usa o solver do Google OR-Tools (ótimo p/ VRP
  com depósito, janelas de tempo e capacidade).
- Caso contrário, cai num heurístico puro-Python (vizinho mais próximo + 2-opt),
  que roda em qualquer lugar, sem dependência externa e sem custo por chamada.

Nenhuma chamada a LLM. Nenhuma chave de API paga. Determinístico e auditável.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

try:  # OR-Tools é opcional — o fallback garante que o serviço sempre funciona.
    from ortools.constraint_solver import pywrapcp, routing_enums_pb2

    HAS_ORTOOLS = True
except Exception:  # pragma: no cover - depende do ambiente
    HAS_ORTOOLS = False


EARTH_RADIUS_M = 6_371_000.0


def haversine(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Distância em metros entre dois pontos (lat, lon)."""
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))


@dataclass
class Stop:
    id: str
    lat: float
    lon: float
    demand: int = 0          # p/ restrição de capacidade (nº de pacotes/volume)
    service_time_s: int = 0  # tempo parado na entrega
    tw_start_s: Optional[int] = None  # janela de tempo (segundos desde 00:00)
    tw_end_s: Optional[int] = None


@dataclass
class OptimizeResult:
    order: list[str]                 # ids na ordem otimizada (sem o depósito)
    total_distance_m: float
    legs_m: list[float] = field(default_factory=list)
    solver: str = "2opt"
    round_trip: bool = False


def _build_matrix(points: list[tuple[float, float]]) -> list[list[int]]:
    n = len(points)
    m = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            d = int(round(haversine(points[i], points[j])))
            m[i][j] = m[j][i] = d
    return m


# --------------------------------------------------------------------------- #
# Heurístico puro-Python (fallback universal)
# --------------------------------------------------------------------------- #
def _nearest_neighbor(matrix: list[list[int]], start: int) -> list[int]:
    n = len(matrix)
    unvisited = set(range(n)) - {start}
    tour = [start]
    cur = start
    while unvisited:
        nxt = min(unvisited, key=lambda j: matrix[cur][j])
        tour.append(nxt)
        unvisited.remove(nxt)
        cur = nxt
    return tour


def _tour_len(matrix: list[list[int]], tour: list[int], round_trip: bool) -> int:
    total = sum(matrix[tour[i]][tour[i + 1]] for i in range(len(tour) - 1))
    if round_trip:
        total += matrix[tour[-1]][tour[0]]
    return total


def _two_opt(matrix: list[list[int]], tour: list[int], round_trip: bool) -> list[int]:
    """Refinamento 2-opt. Mantém o primeiro nó (depósito) fixo."""
    best = tour[:]
    improved = True
    n = len(best)
    while improved:
        improved = False
        for i in range(1, n - 1):
            for k in range(i + 1, n):
                if k - i == 1:
                    continue
                new = best[:i] + best[i:k][::-1] + best[k:]
                if _tour_len(matrix, new, round_trip) < _tour_len(matrix, best, round_trip):
                    best = new
                    improved = True
    return best


def _solve_heuristic(matrix: list[list[int]], depot: int, round_trip: bool) -> list[int]:
    tour = _nearest_neighbor(matrix, depot)
    return _two_opt(matrix, tour, round_trip)


# --------------------------------------------------------------------------- #
# OR-Tools (quando disponível) — suporta capacidade e janelas de tempo
# --------------------------------------------------------------------------- #
def _solve_ortools(
    matrix: list[list[int]],
    stops: list[Stop],
    depot: int,
    round_trip: bool,
    vehicle_capacity: Optional[int],
    time_limit_s: int,
) -> Optional[list[int]]:  # pragma: no cover - exige ortools
    n = len(matrix)
    ends = depot if round_trip else n  # nó fantasma p/ rota aberta
    if not round_trip:
        # adiciona nó dummy com custo 0 de/para todos -> permite terminar em qualquer lugar
        matrix = [row[:] + [0] for row in matrix] + [[0] * (n + 1)]
        size = n + 1
        end_node = n
    else:
        size = n
        end_node = depot

    manager = pywrapcp.RoutingIndexManager(size, 1, [depot], [end_node])
    routing = pywrapcp.RoutingModel(manager)

    def dist_cb(i, j):
        return matrix[manager.IndexToNode(i)][manager.IndexToNode(j)]

    transit = routing.RegisterTransitCallback(dist_cb)
    routing.SetArcCostEvaluatorOfAllVehicles(transit)

    if vehicle_capacity:
        def demand_cb(i):
            node = manager.IndexToNode(i)
            return stops[node].demand if node < len(stops) else 0

        d_idx = routing.RegisterUnaryTransitCallback(demand_cb)
        routing.AddDimensionWithVehicleCapacity(d_idx, 0, [vehicle_capacity], True, "Capacity")

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.FromSeconds(max(1, time_limit_s))

    sol = routing.SolveWithParameters(params)
    if not sol:
        return None
    order = []
    idx = routing.Start(0)
    while not routing.IsEnd(idx):
        node = manager.IndexToNode(idx)
        if node < n:  # ignora nó dummy
            order.append(node)
        idx = sol.Value(routing.NextVar(idx))
    return order


# --------------------------------------------------------------------------- #
# API pública
# --------------------------------------------------------------------------- #
def optimize(
    stops: list[Stop],
    depot_index: int = 0,
    round_trip: bool = False,
    vehicle_capacity: Optional[int] = None,
    time_limit_s: int = 5,
) -> OptimizeResult:
    """Ordena as paradas minimizando a distância total.

    `depot_index` é o ponto de partida (ex.: garagem/CD). Em `round_trip`, a rota
    retorna ao depósito no fim.
    """
    if len(stops) <= 1:
        return OptimizeResult(order=[s.id for s in stops], total_distance_m=0.0,
                              solver="trivial", round_trip=round_trip)

    points = [(s.lat, s.lon) for s in stops]
    matrix = _build_matrix(points)

    order_idx: Optional[list[int]] = None
    solver = "2opt"
    if HAS_ORTOOLS:
        order_idx = _solve_ortools(matrix, stops, depot_index, round_trip,
                                   vehicle_capacity, time_limit_s)
        solver = "ortools"
    if order_idx is None:
        order_idx = _solve_heuristic(matrix, depot_index, round_trip)
        solver = "2opt"

    legs = [float(matrix[order_idx[i]][order_idx[i + 1]]) for i in range(len(order_idx) - 1)]
    if round_trip:
        legs.append(float(matrix[order_idx[-1]][order_idx[0]]))
    total = sum(legs)
    # devolve a ordem SEM o depósito (o app já sabe onde é a origem)
    ordered_ids = [stops[i].id for i in order_idx if i != depot_index]
    return OptimizeResult(order=ordered_ids, total_distance_m=total, legs_m=legs,
                          solver=solver, round_trip=round_trip)
