import { returnGreeting as returnGreetingLength } from './01-Export2.js';         // imports a single function in the module
import * as allGreetingFunctions from './01-Export2.js';  // imports all exported components in the module

returnGreetingLength('Hola!')  // Displays 'The message from Greetings_module is Hola!'
allGreetingFunctions.returnGreeting('Bonjour');  // Displays 'The message from Greetings_module is Bonjour!'
returnGreetingLength('Ciao!');  // Displays 'The message from GreetingsWithLength_module is Ciao! It is 5 characters long.'