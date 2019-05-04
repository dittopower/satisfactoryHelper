let recipes = {};
let machineRecipes = {};
const aside = document.getElementsByTagName("aside")[0];
const outputQuantity = document.getElementById("quantity");
const functionTypeSelector = document.getElementById("functionType");
const recipeTypeSelector = document.getElementById("recipeType");
const colourSchemeSelector = document.getElementById("colourScheme");
const article = document.getElementsByTagName("article")[0];
const table = document.getElementsByTagName("table")[0];
let currentRecipe = undefined;
let currentQuantity = 1;
let currentTypeMode = functionTypeSelector.value;
let currentRecipeMode = recipeTypeSelector.value;
let colourScheme = colourSchemeSelector.value;
const typeModeList = {
	"new": "v2",
	"manager": "manager"
};
const recipeModeList = {
	"normal": "normal",
	"machine": "machine"
};
const colourSchemeList = {
	"crafting": "crafting",
	"ingredientB": "ingredientB",
	"ingredientG": "ingredientG",
	"ingredientR": "ingredientR"
};
let trackingRows = [];
let trackingColumns = [];
let oddRow = true;
let totalItems = 0;

fetch(`${location.protocol}//${location.host}/recipes.json`).then(
	(resp) => {
		console.info(resp);
		return resp.json();
	},
	(error) => {
		console.error(error);
		alert("Failed to load recipes.");
	}
).then(
	(packageJson) => {
		recipes = packageJson;
		calcTiers();
		calcNumbers();
		calcTotal();

		runAsync(generateSideList);

		outputQuantity.addEventListener("change", selectRecipe);
		recipeTypeSelector.addEventListener("change", changeSource);
		// changeSource(recipeTypeSelector.value);
		functionTypeSelector.addEventListener("change", changeType);
		// changeType(functionTypeSelector.value);
		colourSchemeSelector.addEventListener("change", changeColours);
		// changeColours(colourSchemeSelector.value);
	}
);
fetch(`${location.protocol}//${location.host}/machineRecipes.json`).then(
	(resp) => {
		console.info(resp);
		return resp.json();
	},
	(error) => {
		console.error(error);
		alert("Failed to load machineRecipes.");
	}
).then(
	(packageJson) => {
		machineRecipes = packageJson;
	}
);

function generateSideList() {
	logBegin();
	let sidebar;
	if (aside.firstElementChild && aside.firstElementChild.tagName == "UL") {
		sidebar = aside.firstElementChild;
		[...sidebar.childNodes].forEach(child => {
			child.remove();
		});
	} else {
		sidebar = document.createElement("ul");
		sidebar.addEventListener("click", selectRecipe);
		aside.appendChild(sidebar);
	}

	let sortRecipes = new Array();
	for (let recipe in getRecipes()) {
		sortRecipes.push(recipe);
	}
	sortRecipes.sort();

	sortRecipes.forEach(recipe => {
		// window.requestIdleCallback(() => {
		let entry = document.createElement("li");
		entry.textContent = `${getRecipeNumber(recipe)} | ${isNaN(getRecipeCraftingTier(recipe)) ? "-" : getRecipeCraftingTier(recipe)} |   ${recipe}`;
		entry.data = recipe;
		let colours = recipeColours(recipe);
		entry.style.backgroundColor = `rgba(${colours["red"]},${colours["green"]},${colours["blue"]},0.6)`;
		sidebar.appendChild(entry);
		// });
	});
}

function runAsync(func) {
	window.requestIdleCallback(() => {
		func();
	});
}

function recipeColours(recipe) {
	switch (colourScheme) {
		case colourSchemeList.crafting:
			return calcTierColour(getTotalCraftingTier(), getRecipeCraftingTier(recipe));
		default:
			return calcTierColour(totalItems, getRecipeNumber(recipe));
	}
}

function changeColours(event) {
	logBegin(event);
	if (typeof event == "object") {
		colourScheme = event.target.value;
	} else {
		colourScheme = event;
	}
	runAsync(reloadDisplay);
	runAsync(generateSideList);
	logEnd();
}

function changeType(event) {
	logBegin("changeType", arguments);
	if (typeof event == "object") {
		currentTypeMode = event.target.value;
	} else {
		currentTypeMode = event;
	}
	runAsync(reloadDisplay);
	logEnd("changeType");
}

function changeSource(event) {
	logBegin("changeSource", arguments);
	if (typeof event == "object") {
		currentRecipeMode = event.target.value;
	} else {
		currentRecipeMode = event;
	}
	calcTotal();
	runAsync(reloadDisplay);
	runAsync(generateSideList);
	logEnd("changeSource");
}

function reloadDisplay() {
	logBeginSub();
	v2resetDisplay();
	switch (currentTypeMode) {
		case typeModeList.manager:
			displayRecipeManager();
			break;
		default:
			selectRecipe(event);
			break;
	}
	logEndSub();
}

function calcTotal() {
	totalItems = 0;
	for (let recipe in getRecipes()) {
		totalItems++;
	};
}

function clearDisplay() {
	[...table.children].forEach((child) => {
		child.remove();
	})
}

function minMax(value, min, max) {
	return Math.max( //Value should not be smaller than min
		min,
		Math.min(max, value) //Value should not be larger than max
	);
}

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

	// let hex = value.toString(16);
	// colours["red"] = +("0x" + hex.substr(0, hex.length / 3));
	// colours["green"] = +("0x" + hex.substr(hex.length / 3, hex.length / 3));
	// colours["blue"] = +("0x" + hex.substr(hex.length / 3 * 2, hex.length / 3));
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

function calcNumbers() {
	logBeginSub();
	for (let recipe in getRecipes()) {
		setRecipeNumber(recipe, totalItems);
		totalItems++;
	}
	logEndSub();
}

function calcTiers() {
	let allowedCalcs = 6;
	_calcTiers(allowedCalcs);
}

function _calcTiers(allowedCalcs) {
	logBeginSub();
	allowedCalcs--;
	let changed = 0;
	for (let recipe in getRecipes()) {
		let init = getRecipeCraftingTier(recipe);

		for (let comp in getRecipe(recipe)) {
			let num = 0;

			for (let prop in getRecipeOption(recipe, comp)) {
				if (isRecipe(prop)) {
					num = Math.max(num, 1, getRecipeCraftingTier(prop) + 1);
					setRecipeOptionCraftingTier(recipe, comp, num);
				}
			}
			if (getRecipeCraftingTier(recipe)) {
				if (init != num) {
					setRecipeCraftingTier(recipe, Math.max(num, getRecipeCraftingTier(recipe)));
				}
			} else {
				setRecipeCraftingTier(recipe, num);
			}
			setTotalCraftingTier(Math.max(num + 1, getTotalCraftingTier()));
		}

		if (init != getRecipeCraftingTier(recipe)) {
			if (isNaN(init) && typeof init != "number") {
				changed++;
			}
		}
	}
	console.info(`Recalculated ${changed} crafting tiers.`);
	if (changed > 0 && allowedCalcs > 0) {
		calcTiers(allowedCalcs);
	}
	logEndSub();
}

function selectRecipe(event) {
	logBegin(event);

	if (event && event.target) {
		if (/INPUT/.test(event.target.tagName)) {
			if (!isNaN(outputQuantity.value)) {
				currentQuantity = Number.parseInt(outputQuantity.value);
			}
		}
		if (/LI/.test(event.target.tagName)) {
			let inputText = event.target.data;
			if (isRecipe(inputText)) {
				currentRecipe = inputText;
			}
		}
	}
	if (currentRecipe && currentQuantity) {
		window.requestIdleCallback(() => {
			console.info(`Start Mode ${currentTypeMode} Making ${currentRecipe}`);
			switch (currentTypeMode) {
				default:
					v2resetDisplay();
					buildRecipeView(currentRecipe, currentQuantity);
					break;
			}
		});
	}
	logEnd();
}

function jsonAddProperty(property, to, from) {
	if (to[property]) {
		to[property] += from[property]
	} else {
		to[property] = from[property];
	}
	return to;
}
function jsonAdd(to, from) {
	for (let prop in from) {
		if (to[prop]) {
			to[prop] += from[prop];
		} else {
			to[prop] = from[prop];
		}
	}
	return to;
}

const stackRegEx = /at (?![a-z]+:\/\/)(\S+)/g
// const stackRegEx = /at (\S+)/g
function logBegin() {
	let stack = (new Error()).stack.match(stackRegEx);
	let func = stack[1] || stack.pop();
	console.warn(`[BEGIN]${func.split(/ |\./).pop()}`, JSON.stringify(arguments));
}
function logEnd() {
	let stack = (new Error()).stack.match(stackRegEx);
	let func = stack[1] || stack.pop();
	console.debug(`[END]${func.split(/ |\./).pop()}`, JSON.stringify(arguments));
}
function logBeginSub() {
	let stack = (new Error()).stack.match(stackRegEx);
	let func = stack[1] || stack.pop();
	console.debug(`	{START}${func.split(/ |\./).pop()}`, JSON.stringify(arguments));
}
function logEndSub() {
	let stack = (new Error()).stack.match(stackRegEx);
	let func = stack[1] || stack.pop();
	console.debug(`	{FINISH}${func.split(/ |\./).pop()}`, JSON.stringify(arguments));
}

function getRecipes() {
	if (currentRecipeMode == recipeModeList.machine) {
		return machineRecipes;
	}
	return recipes;
}
function getRecipe(data) {
	return getRecipes()[data];
}
function getRecipeOption(data, option) {
	return getRecipe(data)[option];
}
function isRecipe(data) {
	return !!getRecipe(data);
}
function isRecipeOption(data, option) {
	return !!getRecipeOption(data, option);
}
function getTotalCraftingTier() {
	return Number.parseInt(localStorage.getItem(`CraftingTier`)) || 0;
}
function setTotalCraftingTier(tier) {
	return localStorage.setItem(`CraftingTier`, tier);
}
function getRecipeCraftingTier(data) {
	return Number.parseInt(localStorage.getItem(`${data}.CraftingTier`));
}
function setRecipeCraftingTier(data, tier) {
	return localStorage.setItem(`${data}.CraftingTier`, tier);
}
function getRecipeOptionCraftingTier(data, option) {
	return Number.parseInt(localStorage.getItem(`${data}.${option}.CraftingTier`));
}
function setRecipeOptionCraftingTier(data, option, tier) {
	return localStorage.setItem(`${data}.${option}.CraftingTier`, tier);
}
function getRecipeOptionEnabled(recipe, option) {
	return false.toString() != localStorage.getItem(`${recipe}.${option}.Enabled`);
}
function setRecipeOptionEnabled(recipe, option, status) {
	return localStorage.setItem(`${recipe}.${option}.Enabled`, status.toString());
}
function getRecipeNumber(recipe) {
	return Number.parseInt(localStorage.getItem(`${recipe}.Number`));
}
function setRecipeNumber(recipe, num) {
	return localStorage.setItem(`${recipe}.Number`, num);
}

function exploreRecipe(data, quantity) {
	console.warn("exploreRecipe", data)
	let versions = [];

	let recipeOptions = getRecipe(data);
	for (let opt in recipeOptions) {
		if (!recipeOptions[opt] || recipeOptions[opt].constructor.name != "Object") {
			break;
		}
		versions.push(exploreRecipeOption(data, quantity, opt))
	}
	console.warn(`exploreRecipe: '${data}'`, JSON.stringify(versions));
	return versions;
}

function exploreRecipeOption(data, quantity, option) {
	console.warn(`exploreRecipeOption: '${data}' Opt: '${option}'`);
	if (!isRecipe(data) || !isRecipeOption(data, option) || getRecipeOption(data, option).constructor.name != "Object") {
		throw new Error("Invalid Recipe Option");
	}

	let versions = [];
	let recipe = getRecipeOption(data, option);
	// Determine the number of times this recipe needs to be executed.
	let multiple = Math.ceil(quantity / recipe["Makes"]);
	versions.push({
		name: data,
		quantity: recipe["Makes"] * multiple,
		recipe: option
	});


	// Is this a harvest/gather or a craft?
	if (recipe["Harvest"]) {//If this gets used update this
		console.log("harvest");
	} else {
		console.log("craft");
		versions.push(new Array());

		//		 Get the ingredient stages
		for (let ingredient in recipe) {
			if (getRecipe(ingredient)) {
				let tempClone = Array.from(versions);
				versions[1] = new Array();

				let ingredientRecipes = exploreRecipe(ingredient, recipe[ingredient] * multiple);
				ingredientRecipes.forEach((res) => { console.log("ingredientRecipes", JSON.stringify(res)); });

				console.log("tempClone[1]", JSON.stringify(tempClone[1]));
				for (let ingredientOption = 0; ingredientOption < ingredientRecipes.length; ingredientOption++) {
					console.log("ingredientOption", ingredientOption);
					console.log("versions", JSON.stringify(versions));

					// Additional Ingredients
					for (let i = 0; i < ingredientRecipes[ingredientOption].length; i++) {
						if (ingredientRecipes[ingredientOption][i]) {
							let ref = i + 1;
							console.log("..joining", JSON.stringify(ingredientRecipes[ingredientOption][i]))

							if (i == 0) {
								if ((!tempClone[ref]) || tempClone[ref].length == 0) {
									versions[ref].push([ingredientRecipes[ingredientOption][i]]);
								} else {
									for (let existing in tempClone[ref]) {
										versions[ref].push((tempClone[ref][existing] ? tempClone[ref][existing] : []).concat([ingredientRecipes[ingredientOption][i]]));
									}
								}

							} else {
								if ((!versions[ref]) || versions[ref].length == 0) {
									versions[ref] = [ingredientRecipes[ingredientOption][i]];
								} else {
									versions[ref] = (versions[ref] ? versions[ref] : []).concat([ingredientRecipes[ingredientOption][i]]);
								}
							}
						}
					}

				}

			}
		}
	}

	console.warn(`exploreRecipeOption return: '${data}' Opt: '${option}'`, JSON.stringify(versions));
	return versions;
}

function buildRecipeView(data, quantity, depth = 0) {
	logBegin(arguments);

	let recipe = getRecipe(data);
	for (let option in recipe) {
		logBeginSub("buildRecipeViewOption", data, option);

		if (!isRecipe(data) || !isRecipeOption(data, option) || getRecipeOption(data, option).constructor.name != "Object") {
			throw new Error("Invalid Recipe Option");
		}
		let recipeOption = getRecipeOption(data, option);

		// Determine the number of times this recipe needs to be executed.
		let multiple = Math.ceil(quantity / recipeOption["Makes"]);
		v2addIngredient([data, option, multiple], depth);
		if (getRecipeOptionEnabled(data, option)) {
			// Get the ingredient stages
			for (let ingredient in recipeOption) {
				if (isRecipe(ingredient)) {
					buildRecipeView(ingredient, multiple * recipeOption[ingredient], depth + 1);
				}
			}
		}
		v2mark(depth);

		logEndSub("buildRecipeViewOption", data, option);
	}
	logEnd();
	return depth;
}

function v2resetDisplay() {
	for (let key in trackingColumns) {
		trackingColumns[key].remove();
	}
	for (let key in trackingRows) {
		trackingRows[key].remove();
	}
	trackingRows = [];
	trackingColumns = [];
	oddRow = true;
	clearDisplay();
}

function v2mark(column) {
	logBeginSub("v2mark");
	trackingRows = [];
	if (column == 0) {
		oddRow = !oddRow;
	}
}

function v2addIngredient(content, column) {
	logBeginSub("v2addIngredient", arguments);
	if (trackingRows.length < 1) {
		let tr = document.createElement("tr");
		trackingRows.push(tr);
		table.appendChild(tr);
		let num = Math.max(256 - 20 * trackingRows.length, 20);
		tr.style.backgroundColor = `rgba(${num},${num},${num},${oddRow ? "0.0" : "0.1"})`;
	}
	for (const row in trackingRows) {
		let tr = trackingRows[row];
		if (tr.childElementCount == 0 && column > 0) {
			for (let col in trackingColumns) {
				if (col < column) {
					trackingColumns[col].rowSpan++
				}
			}
		}

		let td = v2FormatData(content[0], content[1], content[2]);
		tr.appendChild(td);
		trackingColumns[column] = td;
	}
}

function v2FormatData(data, option, multiple) {
	let td = document.createElement("td");

	td.appendChild(toggleEnableButton(data, option, disableAndRefresh));

	let ul = document.createElement("ul");

	let li = document.createElement("li");
	li.innerText = `${data}`;
	ul.appendChild(li);

	li = document.createElement("li");
	li.innerText = `Quantity: ${getRecipeOption(data, option)["Makes"] * multiple}`;
	ul.appendChild(li);
	td.appendChild(ul);

	ul = document.createElement("ul");
	li = document.createElement("li");
	li.innerText = `Recipe Variant: ${option}`;
	ul.appendChild(li);

	li = document.createElement("li");
	li.innerText = `Makes: ${getRecipeOption(data, option)["Makes"]}`;
	ul.appendChild(li);
	li = document.createElement("li");
	li.innerText = `Required Crafts: ${multiple}`;
	ul.appendChild(li);

	let colours = recipeColours(data);
	if (!getRecipeOptionEnabled(data, option)) {
		td.style.textDecoration = "line-through wavy black";
		td.style.backgroundColor = `rgba(${colours["red"]},${colours["green"]},${colours["blue"]},0.3)`;
	} else {
		td.style.backgroundColor = `rgba(${colours["red"]},${colours["green"]},${colours["blue"]},0.6)`;
	}

	td.appendChild(ul);

	return td;
}

function disableAndRefresh(event) {
	updateRecipeOptionEnabledStatus(event);
	selectRecipe(event);
}

function toggleEnableButton(recipe, option, callback = updateRecipeOptionEnabledStatus) {

	const enabled = getRecipeOptionEnabled(recipe, option);
	let toggleEnabled = document.createElement("INPUT");
	toggleEnabled.type = "button";
	toggleEnabled.data = [recipe, option];
	toggleEnabled.value = !enabled ? "Enable" : "Disable";
	toggleEnabled.classList.add(!enabled ? "enabler" : "disabler");
	toggleEnabled.addEventListener("click", callback);
	return toggleEnabled;
}

function displayRecipeManager() {
	logBegin("displayRecipeManager");
	v2resetDisplay();
	for (let entry in getRecipes()) {
		const recipe = getRecipe(entry);
		addItemToManager(0, entry);
		for (let variant in recipe) {
			addItemToManager(1, entry, variant);
			v2mark(1);
		}
		v2mark(0);
	}
	logEnd("displayRecipeManager");
}

function addItemToManager(column, recipe, option) {
	logBegin("addItemToManager", arguments);
	if (trackingRows.length < 1) {
		let tr = document.createElement("tr");
		trackingRows.push(tr);
		table.appendChild(tr);
		let num = Math.max(256 - 40 * trackingRows.length, 20);
		tr.style.backgroundColor = `rgba(${num},${num},255,${oddRow ? "0.0" : "0.1"})`;
	}
	for (const row in trackingRows) {
		let tr = trackingRows[row];
		if (tr.childElementCount == 0 && column > 0) {
			for (let col in trackingColumns) {
				if (col < column) {
					trackingColumns[col].rowSpan++
				}
			}
		}

		let td = document.createElement("td");
		const data = getRecipe(recipe);
		if (option) {
			const opt = getRecipeOption(recipe, option);
			const enabled = getRecipeOptionEnabled(recipe, option);
			const ul = document.createElement("ul");

			let li = document.createElement("li");
			li.innerText = `Variant: ${option}`;
			ul.appendChild(li);
			li = document.createElement("li");
			li.innerText = `Enabled: ${enabled}`;
			ul.appendChild(li);

			for (let ingredient in opt) {
				if (isRecipe(ingredient)) {
					li = document.createElement("li");
					li.innerText = `${ingredient} x ${opt[ingredient]}`;
					ul.appendChild(li);
				} else {
					li = document.createElement("li");
					if (/number|string/.test(typeof opt[ingredient])) {
						li.innerText = `${ingredient}: ${opt[ingredient]}`;
					} else {
						li.innerText = `${ingredient}`;
					}
					ul.appendChild(li);
				}
			}

			td.appendChild(toggleEnableButton(recipe, option));
			td.appendChild(ul);

			let colours = calcTierColour(data.length, option);
			td.style.backgroundColor = `rgba(${colours["red"]},${colours["green"]},${colours["blue"]},0.2)`;

		} else {
			const ul = document.createElement("ul");
			let li = document.createElement("li");
			li.innerText = `${recipe}`;
			ul.appendChild(li);
			td.appendChild(ul);

			let colours = recipeColours(recipe);
			td.style.backgroundColor = `rgba(${colours["red"]},${colours["green"]},${colours["blue"]},0.6)`;
		}

		tr.appendChild(td);
		trackingColumns[column] = td;
	}
	logEnd("addItemToManager");
}

function updateRecipeOptionEnabledStatus(event) {
	logBegin("updateRecipeOptionEnabledStatus", arguments);
	let recipe = event.target.data[0];
	let option = event.target.data[1];
	if (/enable/i.test(event.target.value)) {
		setRecipeOptionEnabled(recipe, option, true);
	} else {
		setRecipeOptionEnabled(recipe, option, false);
	}
	let toggleEnabled = event.target;
	let enabled = getRecipeOptionEnabled(recipe, option);
	toggleEnabled.value = !enabled ? "Enable" : "Disable";
	toggleEnabled.classList.add(!enabled ? "enabler" : "disabler");
	toggleEnabled.classList.remove(enabled ? "enabler" : "disabler");
	logEnd("updateRecipeOptionEnabledStatus");
}
