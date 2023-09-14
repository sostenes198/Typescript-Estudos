let randomValue: any = 10;
randomValue = 'Mateo';   // OK
randomValue = true;      // OK


let randomUnknownValue: unknown = 10;
randomUnknownValue = true;
randomUnknownValue = 'Mateo';

// console.log(randomUnknownValue.name);  // Error: Object is of type unknown
// randomUnknownValue();                  // Error: Object is of type unknown
// randomUnknownValue.toUpperCase();      // Error: Object is of type unknown
if (typeof randomUnknownValue === "string") {
    console.log((randomUnknownValue as string).toUpperCase());    //* Returns MATEO to the console.
} else {
    console.log("Error - A string was expected here.");    //* Returns an error message.
}