# Scripts

Production-ready utility scripts extracted from skill references.

## Directory Structure

```
.opencode/scripts/
├── context/           # Context engineering utilities
│   ├── compression_evaluator.py
│   ├── degradation_detector.py
│   ├── context_manager.py
│   ├── compaction.py
│   └── coordination.py
├── evaluation/        # Evaluation frameworks
│   └── evaluator.py
└── tools/            # Tool utilities
    └── description_generator.py
```

## Usage

> **Note**: For manual runs, use `uv run` for consistent dependency management. The AI agent has Python injected into its environment and can run scripts directly.

### Context Scripts

```bash
# Evaluate compression quality
uv run .opencode/scripts/context/compression_evaluator.py

# Detect context degradation
uv run .opencode/scripts/context/degradation_detector.py

# Build optimized context
uv run .opencode/scripts/context/context_manager.py
```

### Evaluation Scripts

```bash
# Run evaluation suite
uv run .opencode/scripts/evaluation/evaluator.py
```

## Patterns

See [production-patterns.md](patterns/production-patterns.md) for consolidated patterns documentation.

## Contributing

When adding new scripts:

1. Follow existing structure
2. Include docstrings with usage examples
3. Add type hints
4. Handle errors gracefully
