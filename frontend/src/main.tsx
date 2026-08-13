
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Função aprimorada para remover botões e elementos do Lovable
const removeLovableElements = () => {
  // Adicionar CSS para ocultar os elementos Lovable
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .lovable-edit-button, 
    [data-lovable], 
    [class*="lovable-"], 
    [id*="lovable-"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      left: -9999px !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }
  `;
  document.head.appendChild(styleElement);
  
  // Remover elementos existentes
  const removeElements = () => {
    const selectors = [
      '.lovable-edit-button',
      '[data-lovable]',
      '[class*="lovable-"]',
      '[id*="lovable-"]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  };
  
  // Remover imediatamente os elementos existentes
  removeElements();
  
  // Configurar MutationObserver para remover elementos quando adicionados ao DOM
  const observer = new MutationObserver((mutations) => {
    let shouldRemove = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        shouldRemove = true;
        break;
      }
    }
    
    if (shouldRemove) {
      removeElements();
    }
  });
  
  // Observar todo o documento para adições de nós
  observer.observe(document.documentElement, { 
    childList: true,
    subtree: true
  });
};

// Executar após o carregamento do DOM
document.addEventListener('DOMContentLoaded', removeLovableElements);
// Executar imediatamente caso o DOM já esteja pronto
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  removeLovableElements();
}

createRoot(document.getElementById("root")!).render(<App />);
