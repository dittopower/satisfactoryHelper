
function minMaxRGB(value) {
    return minMax(value, 0, 200);
}

function percentToColour(percent) {
    // percent as a decimal i.e. 0.5 == 50%

    const max = 256;
    const total = max ** 3; // 16777216 possible colour combinations
    const square = max ** 2; // 65536 number of possibilities for the other colours per value of colour X
    const value = Math.round(total * percent); // Percentage's combination

    let red = Math.trunc(value / square) % 256; // mod by 256 to ensure our max value is 255 (not 256 or higher)
    let green = Math.trunc(value / square % 1 * max) % 256;
    let blue = Math.round(value / square % (1 / max) * square) % 256;

    return [red, green, blue];
}

function calcTierColour(totalTiers, thisTier) {
    logBeginSub(arguments);
    totalTiers = Number.parseInt(totalTiers);
    thisTier = Number.parseInt(thisTier);
    const colours = new Array();

    const modifier = thisTier / totalTiers;

    let temp = percentToColour(modifier);
    switch (colourScheme) {
        case colourSchemeList.ingredientG:
            colours["blue"] = temp[2];
            colours["red"] = temp[1];
            colours["green"] = temp[0];
            break;
        case colourSchemeList.ingredientR:
            colours["red"] = temp[2];
            colours["green"] = temp[1];
            colours["blue"] = temp[0];
            break;
        default:
            colours["blue"] = temp[2];
            colours["green"] = temp[1];
            colours["red"] = temp[0];
            break;
    }

    logEndSub(colours);
    return colours;
}