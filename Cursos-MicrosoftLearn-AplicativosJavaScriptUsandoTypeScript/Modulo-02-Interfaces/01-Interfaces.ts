interface NewEmployee{
    firstName: string;
    lastName: string;
    fullName(): string;
}

let employee : NewEmployee = {
    firstName: "Soso",
    lastName: "Souza",
    fullName() {
        return this.firstName + " " + this.lastName
    }
}

interface IceCream {
    flavor: string;
    scoops: number;
    instructions?: string;
 }

 interface Sundae extends IceCream {
    sauce: 'chocolate' | 'caramel' | 'strawberry';
    nuts?: boolean;
    whippedCream?: boolean;
    instructions?: string;
}

 let myIceCream: IceCream = {
    flavor: 'vanilla',
    scoops: 2
 }
 
 console.log(myIceCream.flavor);

 function tooManyScoops(dessert: IceCream) : string {
    if (dessert.scoops >= 4) {
       return dessert.scoops + ' is too many scoops!';
    } else {
       return 'Your order will be ready soon!';
    }
 }
 
 console.log(tooManyScoops({flavor: 'vanilla', scoops: 5}));

 interface IceCreamArray {
    [index: number]: string;
}

let myIceCream2: IceCreamArray;
myIceCream2 = ['chocolate', 'vanilla', 'strawberry'];
let myStr: string = myIceCream2[0];
console.log(myStr);