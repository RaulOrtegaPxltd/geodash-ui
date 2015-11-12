if (!bdl) {
	var bdl = {};
	bdl.geodash = {};
}

bdl.geodash.addSelector = function(boneId) {
	var targetMe = function(values, attributeId) {
		// TODO: Bones cannot be used any more
		microstrategy.bone(boneId).makeSelection(values, attributeId, null, null, true);
	}
    // TODO: This is no longer using an iFrame so references to window.parent are not relevant any longer.
	window.parent.gdSelectorFunctions.push(targetMe);
}

$(document).ready(function() {
    // TODO: This is no longer using an iFrame so references to window.parent are not relevant any longer.	
	if (typeof (window.parent.gdSelectorFunctions) == "undefined") {
		window.parent.gdSelectorFunctions = [];
	}
});
