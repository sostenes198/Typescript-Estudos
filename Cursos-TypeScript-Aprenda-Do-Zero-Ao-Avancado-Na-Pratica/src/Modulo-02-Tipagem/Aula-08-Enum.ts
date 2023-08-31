enum DesignColors {
    white = "#FFFF",
    black = "#0000"
}

enum StatusUser {
    ADMIN = 1,
    USER,
    SUPPORT
}

console.log(DesignColors.black);
console.log(DesignColors.white);

console.log(StatusUser.ADMIN);
console.log(StatusUser.USER);
console.log(StatusUser.SUPPORT);

// Pegar o nome do enum
console.log(StatusUser[StatusUser.ADMIN])