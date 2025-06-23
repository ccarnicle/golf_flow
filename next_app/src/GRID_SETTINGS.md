# Grid System Guide

This document explains the grid system used for positioning elements within the Phaser game canvas. It is intended for both developers and AI assistants to ensure consistent and accurate layout implementation.

## 1. Core Concepts

The layout of game elements is based on a virtual grid overlaid on the game canvas. All positioning instructions should be provided in grid units rather than raw pixels.

- **Coordinate Origin**: The grid starts at `(1, 1)` in the **top-left corner**.
- **X-axis**: Values increase from left to right (e.g., `(2, 1)` is to the right of `(1, 1)`).
- **Y-axis**: Values increase from top to bottom (e.g., `(1, 2)` is below `(1, 1)`).
- **Coordinate Format**: Coordinates are always provided in `(X, Y)` format.

## 2. Grid & Canvas Dimensions

There are two sets of dimensions to be aware of: the design dimensions and the implementation dimensions.

### Design-Time Grid (e.g., in Canva)

- **Background Size**: 900px width x 1200px height.
- **Grid Cell Size**: ~45px x 45px.

### Implementation Grid (In-Game)

The game itself runs on a different resolution. The grid is mapped to this implementation canvas.

- **Game Canvas Resolution**: **576px width x 768px height**.
- **Grid Size**: **20 units wide x 26.5 units tall**.

## 3. Converting Grid Coordinates to Pixels

To place an element in the game, grid coordinates must be converted to pixel coordinates.

- **Grid Cell Width**: `576px / 20 units = 28.8px`
- **Grid Cell Height**: `768px / 26.5 units ≈ 28.98px`

For simplicity in calculations, we can use **28.8px** as a standard `gridCellSize`.

### Formula

Use the following formulas to convert a grid coordinate `(gridX, gridY)` to a pixel coordinate `(pixelX, pixelY)`:

```
pixelX = (gridX - 1) * 28.8
pixelY = (gridY - 1) * 28.8
```

### Example

Placing an element at the top-middle of the screen, at grid coordinate **(11, 1)**:

- `pixelX = (11 - 1) * 28.8 = 10 * 28.8 = 288`
- `pixelY = (1 - 1) * 28.8 = 0 * 28.8 = 0`

The resulting pixel coordinate for the top-left of the element would be `(288, 0)`. 