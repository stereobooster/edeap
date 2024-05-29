# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

Fork of https://github.com/mjwybrow/edeap

## TODO

- [ ] decopule parser and initializer
- [ ] write one "big" function to get result
- [ ] untangle mutable state
  - [ ] save each step for optimization, so it would be possible to "time travel"
- [ ] check if it is possible to implement server side version of `findTextSizes`
  - pass it as param so it would be possible to have versions for server and client
- [ ] npm package
- [ ] new demo

## Ideas

Alternatives to clientside `findTextSizes`:

- [resvg-js](https://github.com/yisibl/resvg-js)?
- [canvas](https://github.com/Brooooooklyn/canvas)
  - [measureText](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)

npm packages:

- https://www.npmjs.com/package/get-text-width
- https://github.com/Evgenus/js-server-text-width
- https://www.npmjs.com/package/text-width
- https://github.com/adambisek/string-pixel-width

## Desired API

```ts
generate(options); // returns SVG string
// or
generate(options); // returns Promise<SVG string>
```

`options` should be JS object. Code about saving state to URL or about parsing is the separate thing.
