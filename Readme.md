# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

Fork of https://github.com/mjwybrow/edeap

## TODO

- optimizer.ts
  - [x] convert `optimizer.ts` to class
  - [x] remove module level variables
  - [x] callback for steps
  - [x] remove `document.getElementById` from `optimizer.ts`. It should use callback instead of modifying HTML directly

## Ideas

Alternatives to clientside `findTextSizes`:

- [resvg-js](https://github.com/yisibl/resvg-js)?
- [canvas](https://github.com/Brooooooklyn/canvas)
  - [measureText](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)

## Desired API

```ts
generate(options); // returns SVG string
// or
generate(options); // returns Promise<SVG string>
```

`options` should be JS object. Code about saving state to URL or about parsing is the separate thing.
