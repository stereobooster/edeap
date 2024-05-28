# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

Fork of https://github.com/mjwybrow/edeap

## TODO

- [ ] remove `document.getElementById` from `optimizer.ts`. It should use callback instead of modifying HTML directly
- [ ] convert `optimizer.ts` to class and remove module level variables

## Ideas

Alternatives to clientside `findTextSizes`:

- [resvg-js](https://github.com/yisibl/resvg-js)?
- [canvas](https://github.com/Brooooooklyn/canvas)
  - [measureText](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)
