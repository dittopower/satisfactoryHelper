
const aside = document.getElementsByTagName("aside")[0];
const outputQuantity = document.getElementById("quantity");
const functionTypeSelector = document.getElementById("functionType");
const recipeTypeSelector = document.getElementById("recipeType");
const colourSchemeSelector = document.getElementById("colourScheme");
const article = document.getElementsByTagName("article")[0];
const table = document.getElementsByTagName("table")[0];
let currentQuantity = 1;
let currentTypeMode = functionTypeSelector.value;
let colourScheme = colourSchemeSelector.value;
const typeModeList = {
	"new": "v2",
	"manager": "manager"
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

window.addEventListener('load', init, { once: true });

function init() {
	loadData((availableDataSets) => {
		calcTiers();
		calcNumbers();
		runAsync(generateSideList);
		runAsync(reloadDisplay);
		return availableDataSets;

	}).then((availableDataSets) => {
		if (availableDataSets) {
			for (let value in availableDataSets) {
				if (availableDataSets[value]) {
					let child = document.createElement("option");
					child.value = value;
					child.text = value;
					recipeTypeSelector.appendChild(child);
				}
			}
		}

		outputQuantity.addEventListener("change", selectRecipe);
		recipeTypeSelector.addEventListener("change", changeSource);
		// changeSource(recipeTypeSelector.value);
		functionTypeSelector.addEventListener("change", changeType);
		// changeType(functionTypeSelector.value);
		colourSchemeSelector.addEventListener("change", changeColours);
		// changeColours(colourSchemeSelector.value);
	})
}

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
	try {
		if (typeof event == "object") {
			setCurrentDataSet(event.target.value);
		} else {
			setCurrentDataSet(event);
		}
		// calcNumbers();
		// runAsync(reloadDisplay);
		// runAsync(generateSideList);
	} catch (e) {
		debugger
	}
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

function clearDisplay() {
	[...table.children].forEach((child) => {
		child.remove();
	})
}

function calcNumbers() {
	totalItems = 0;
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
				setCurrentRecipe(inputText);
			}
		}
	}
	if (getCurrentRecipe() && currentQuantity) {
		window.requestIdleCallback(() => {
			console.info(`Start Mode ${currentTypeMode} Making ${getCurrentRecipe()}`);
			switch (currentTypeMode) {
				default:
					v2resetDisplay();
					buildRecipeView(getCurrentRecipe(), currentQuantity);
					break;
			}
		});
	}
	logEnd();
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
