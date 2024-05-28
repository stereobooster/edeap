# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

Fork of https://github.com/mjwybrow/edeap

## TODO

- optimizer.ts
  - [x] convert `optimizer.ts` to class 
  - [ ] remove module level variables
- [ ] remove `document.getElementById` from `optimizer.ts`. It should use callback instead of modifying HTML directly

## Ideas

Alternatives to clientside `findTextSizes`:

- [resvg-js](https://github.com/yisibl/resvg-js)?
- [canvas](https://github.com/Brooooooklyn/canvas)
  - [measureText](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)
