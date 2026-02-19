# OpenCode Scripts

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

### Context Scripts

```bash
# Evaluate compression quality
python .opencode/scripts/context/compression_evaluator.py

# Detect context degradation
python .opencode/scripts/context/degradation_detector.py

# Build optimized context
python .opencode/scripts/context/context_manager.py
```

### Evaluation Scripts

```bash
# Run evaluation suite
python .opencode/scripts/evaluation/evaluator.py
```

## Patterns

See `../patterns/production-patterns.md` for consolidated patterns documentation.

## Contributing

When adding new scripts:

1. Follow existing structure
2. Include docstrings with usage examples
3. Add type hints
4. Handle errors gracefully
