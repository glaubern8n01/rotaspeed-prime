"""Testes do núcleo Python (rodam sem dependências opcionais)."""
from app.services.address_parser import parse_one, parse_many
from app.services.optimizer import Stop, optimize, haversine
from app.services.tracking import TrackPoint, summarize
from app.services import whatsapp


def test_parse_endereco_brasileiro():
    txt = "Rua das Flores, 123, Apto 45 - Bairro Centro, São Paulo SP, 01001-000"
    a = parse_one(txt)
    assert a.number == "123"
    assert a.cep == "01001-000"
    assert a.state == "SP"
    assert "Flores" in (a.street or "")
    assert a.confidence > 0.4


def test_parse_many_quebra_em_linhas():
    txt = "Rua A, 10, Centro, Rio de Janeiro RJ\nAv B, 200, Tijuca, Rio de Janeiro RJ"
    res = parse_many(txt)
    assert len(res) == 2


def test_optimize_ordena_e_reduz_distancia():
    # depósito + 3 paradas fora de ordem
    stops = [
        Stop(id="depot", lat=-23.55, lon=-46.63),
        Stop(id="c", lat=-23.60, lon=-46.60),
        Stop(id="a", lat=-23.56, lon=-46.64),
        Stop(id="b", lat=-23.58, lon=-46.62),
    ]
    res = optimize(stops, depot_index=0, round_trip=False)
    assert set(res.order) == {"a", "b", "c"}
    assert res.total_distance_m > 0
    # ordem otimizada deve ser <= ordem ingênua (a,b,c pela proximidade)
    assert res.order[0] == "a"


def test_track_summary_calcula_km():
    pts = [
        TrackPoint(-23.55, -46.63, 0),
        TrackPoint(-23.56, -46.64, 300),
        TrackPoint(-23.58, -46.62, 900),
    ]
    s = summarize(pts)
    assert s.distance_km > 0
    assert s.duration_s == 900


def test_whatsapp_normaliza_e_gera_link():
    assert whatsapp.normalize_phone_br("(11) 98765-4321") == "5511987654321"
    link = whatsapp.whatsapp_link("11987654321", "oi")
    assert link and link.startswith("https://wa.me/5511987654321")


def test_haversine_zero():
    assert haversine((0, 0), (0, 0)) == 0
