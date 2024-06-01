// Bit masks for different types of logging.
// Each should have a value of "2 ** n" where n is next value.
// const logNothing = 0;
export const logFitnessDetails = 2 ** 0;
export const logOptimizerStep = 2 ** 1;
export const logOptimizerChoice = 2 ** 2;
export const logReproducability = 2 ** 3;

// Select the type of logging to display.  To select multiple types
// of logging, assign this variable a value via options separated by
// bitwise OR (|):
//    showLogTypes = logReproducability | logOptimizerStep;
const showLogTypes = logReproducability;

// Function to be able to disable fitness logging.
export function logMessage(type: number, ..._messages: any[]) {
  if (showLogTypes & type) {
    const args = Array.prototype.slice.call(arguments);
    args.shift();
    console.log.apply(console, args);
  }
}
