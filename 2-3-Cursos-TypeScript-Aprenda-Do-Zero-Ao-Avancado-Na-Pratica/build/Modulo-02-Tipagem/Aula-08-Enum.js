"use strict";
var DesignColors;
(function (DesignColors) {
    DesignColors["white"] = "#FFFF";
    DesignColors["black"] = "#0000";
})(DesignColors || (DesignColors = {}));
var StatusUser;
(function (StatusUser) {
    StatusUser[StatusUser["ADMIN"] = 1] = "ADMIN";
    StatusUser[StatusUser["USER"] = 2] = "USER";
    StatusUser[StatusUser["SUPPORT"] = 3] = "SUPPORT";
})(StatusUser || (StatusUser = {}));
console.log(DesignColors.black);
console.log(DesignColors.white);
console.log(StatusUser.ADMIN);
console.log(StatusUser.USER);
console.log(StatusUser.SUPPORT);
// Pegar o nome do enum
console.log(StatusUser[StatusUser.ADMIN]);
