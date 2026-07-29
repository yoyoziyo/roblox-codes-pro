# Assets locais dos jogos

Cada jogo deve ter uma pasta com o mesmo slug usado em `data/index.json`.

Estrutura recomendada:

```text
public/assets/games/<slug>/
├── icon.webp
├── banner.webp
└── thumbnail.webp
```

Enquanto um asset local ainda não existir, o JSON do jogo pode continuar usando uma URL externa válida.