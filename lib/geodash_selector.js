if (!bdl) {
	var bdl = {};
	bdl.geodash = {};
}

bdl.geodash.addSelector = function(boneId) {
	var targetMe = function(values, attributeId) {
		// TODO: MSTR BONES TO MOJO
		microstrategy.bone(boneId).makeSelection(values, attributeId, null, null, true);
	}

	window.parent.gdSelectorFunctions.push(targetMe);
}

$(document).ready(function() {
	if (typeof (window.parent.gdSelectorFunctions) == "undefined") {
		window.parent.gdSelectorFunctions = [];
	}
});
