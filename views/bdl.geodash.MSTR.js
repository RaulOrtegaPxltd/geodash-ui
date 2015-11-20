(function() {
	// adding selection method to mstr to support multi selection from geodash
    // TODO: This is no longer using an iFrame so references to window.parent are not relevant any longer.
	var gr = window.parent.mstrGridReport;
	if (gr != undefined) {
	    // TODO: Bones cannot be used anymore.
		gr.constructor.prototype.makeGeodashSelections = function(values, attId) {
			var sd = this.getSelectionData(attId);
			if (sd && sd.el && values) {
				var ids = [];
				for (var i = 0; i < values.length; i++) {
					ids.push(sd.el[values[i]].id);
				}
				this.makeSelection(ids, attId, null, null, true);
			}
		}
	}
})();

bdl.geodash.MSTR = {
	form : "form#gd-action-form",

	getMarkerTileStage : function(opts, x, y, z) {
		if (opts.model.get('source') == 'gdgrid') {
			var stage = bdl.geodash.MSTR.getGdGridActionStage("getTile", opts.model);
		} else {
			var stage = bdl.geodash.MSTR.getActionStage("getTile", opts.model);
		}

		stage.data = stage.data + "&" + $.param({
			x : x,
			y : y,
			z : z
		})
		return stage;
	},

	loadModel : function(opts) {
//		var a = bdl.geodash.MSTR, hs = opts.success ? opts.success : function() {
//		}, he = opts.error ? opts.error : function() {
//		};

//		if (opts.model.get('source') == 'gdgrid') {
//			var stage = a.getGdGridActionStage("getLayer", opts.model);
//		} else {
//			var stage = a.getActionStage("getLayer", opts.model);
//		}

		// fix for IE.. it's been slow loading the page, need to try again
//		if (stage == null) {
//			setTimeout(function() {
//				a.loadModel(opts);
//			}, 1000);
//			return;
//		}

		// console.log('MSTR.loadModel', 'stage', stage, 'stage.data', stage.data, opts.model);
//		$.post(stage.url, stage.data, function(resp) {
//			hs(resp);
//		}, 'json').error(function(resp) {
//			he(resp);
//		}).complete(function(resp) {
//			a.updateActionStage(resp);
//		});	
		
		if (opts.model.get('source') == 'external') {
			mstrmojo.xhr.request("POST", mstrConfig.taskURL, opts, {
				taskId : "geodash3GetLayer",
				sessionState : mstrApp.sessionState,
				objectID : opts.model.get('reportID')
			});
		}	
	},

	saveModel : function(opts) {
		// console.log('mstr saveModel', opts);

		var a = bdl.geodash.MSTR, hs = opts.success ? opts.success : function() {
		}, he = opts.error ? opts.error : function() {
		};
		var stage = a.getActionStage("saveLayer", opts.model);
		$.post(stage.url, stage.data, function(resp) {
			hs(resp);
		}, 'json').error(function(resp) {
			he(resp);
		}).complete(function(resp) {
			a.updateActionStage(resp);
		});
	},

	loadModelColumns : function(opts) {
		//TODO: Replace call to get data for reading the data directly from the visualization.
//		var a = bdl.geodash.MSTR; 
//			hs = opts.success ? opts.success : function() {
//			}, 
//			he = opts.error ? opts.error : function() {
//			}; 
			//form = $(bdl.geodash.MSTR.form), 
			//url = form.attr("action"), 
			//data = "taskId=reportExecute&taskEnv=xhr&taskContentType=json&styleName=GeodashActionStyle&geodashAction=getLayerColumns" + "&reportID=" + opts.model.get('reportID') + "&sessionState=" + form.find("input[name=sessionState]").val();
			//data = "taskId=geodash3GetLayerColumns&taskEnv=xhr&taskContentType=json&reportID=" + opts.model.get('reportID') + "&sessionState=" + mstrApp.sessionState;

		//if (a.isRW()) {
			//data += "&originMessageID=" + $("form#gd-external-action-form").find("input[name=originMessageID]").val();
		//} else {
		//	data += "&originMessageID=" + form.find("input[name=originMessageID]").val();
		//}
		var taskInfo = {taskId:"geodash3GetLayerColumns",
		 		 sessionState:mstrApp.sessionState
		 	 };
		var gridKey = opts.model.get('gridKey');
		if(gridKey){
			taskInfo.gridKey = gridKey;
			taskInfo.messageID = mstrApp.getMsgID();
		}else{
			taskInfo.objectID = opts.model.get('reportID');
		}
		
		 mstrmojo.xhr.request("POST",
				 mstrConfig.taskURL,
				 opts,
			 	 taskInfo
		 );
		 //console.log(a, url, data);
		//$.post(url, data, function(resp) {
			//hs(resp);
		//}, 'json').error(function(resp) {
			//he(resp);
		//});
	},

	deleteModel : function(opts) {
		//TODO: modify task call to use MicroStrategy framework instead and call new task to deleteLayer
		var a = bdl.geodash.MSTR, hs = opts.success ? opts.success : function() {
		}, he = opts.error ? opts.error : function() {
		};
		var stage = a.getActionStage("deleteLayer", opts.model);
		$.post(stage.url, stage.data, function(resp) {
			hs(resp);
		}, 'json').error(function(resp) {
			he(resp);
		}).complete(function(resp) {
			a.updateActionStage(resp);
		});
	},

	getGdGridActionStage : function(action, model) {
		//TODO: modify task call to use MicroStrategy framework instead and call new task to getLayer
		var boneID = model.get('gdGridId');
		//TODO: Cannot use bones anymore
		var bone = bdl.geodash.MSTR.getGridBone(model.get('gdGridId'));
		if (bone == null) {
			return null;
		} else {
			// var selector = $(bone.gridSpan).find("div.selector")[0].innerText;

			// out.append("<selector>" + getSelectorID() + "</selector>");
			// out.append("<sessionState>" + getSessionState() + "</sessionState>");
			var partialDisplayKeys = $(bone.gridSpan).find("div.partialDisplayKeys")[0].innerText;
			var sliceID = $(bone.gridSpan).find("div.sliceID")[0].innerText;
			// var boneID = $(bone.gridSpan).find("boneID")[0].innerText;
			var rwb = $(bone.gridSpan).find("div.rwb")[0].innerText;

			// console.log('getGdGridActionStage', 'model.get(source)', model.get('source'), 'bone', bone);

			var mSrc = model.get('source');

			var form = $(bdl.geodash.MSTR.form).clone();
			var js = _.clone(model.toJSON());
			form.find("input[name=partialDisplayKeys]").val(partialDisplayKeys);
			form.find("input[name=sliceID]").val(sliceID);
			form.find("input[name=rwb]").val(rwb);
			form.find("input[name=boneID]").val(boneID);
			form.find("input[name=layer]").val(JSON.stringify(js).replace(/#/, ''));
			form.find("input[name=geodashAction]").val("getLayer");

			// console.log('form: ', form);

			return {
				url : form.attr("action"),
				data : form.serialize()
			};
		}
	},

	getActionStage : function(action, model) {
		//TODO: modify task call to use MicroStrategy framework instead and call new tasks
		var mSrc = model.get('source');
		if ((mSrc == "external" || mSrc == "gdgrid") && bdl.geodash.MSTR.isRW() && action == "getLayer") {
			return bdl.geodash.MSTR.getRWExternalLayerActionStage(model);
		}
		var form = $(bdl.geodash.MSTR.form);
		var js = _.clone(model.toJSON());
		delete js["rows"];
		if (model.get('type') != "kmlLayer") {
			delete js["url"];
		}
		delete js["geom"];

		if (action == "saveLayer" || action == "getLayer" || action == "getTile") {
			form.find("input[name=layer]").val(JSON.stringify(js).replace(/#/, ''));
		} else {
			form.find("input[name=layer]").val(model.id);
		}

		form.find("input[name=geodashAction]").val(action);
		// setup the report id to work on
		// all metadata actions(delete,save) will happen on the currentReportID
		if ((mSrc == "external" || mSrc == "gdgrid") && (action == "getLayer" || action == "getLayerColumns")) {
			form.find("input[name=reportID]").val(model.get('reportID'));
		}
		// console.log('form', form, form.attr('action'));
		return {
			url : form.attr("action"),
			data : form.serialize()
		};
	},

	getRWExternalLayerActionStage : function(model) {
		//TODO: modify task call to use MicroStrategy framework instead and call new task to deleteLayer
		var form = $("form#gd-external-action-form");
		var js = _.clone(model.toJSON());
		delete js["rows"];
		if (model.get('type') != "kmlLayer") {
			delete js["url"];
		}
		delete js["geom"];
		form.find("input[name=reportID]").val(model.get('reportID'));
		form.find("input[name=layer]").val(JSON.stringify(js).replace(/#/, ''));
		return {
			url : form.attr("action"),
			data : form.serialize()
		};
	},

	isRW : function() {
		//TODO: This will most likely be not needed anymore
		var rwb = $(bdl.geodash.MSTR.form).find("input[name=rwb]").val();
		if (rwb && $.trim(rwb) != "") {
			return true;
		} else {
			return false;
		}
	},

	// data = response data
	updateActionStage : function(data) {
	    // TODO: We cannot use this action stage any longer. We will need to refactor this to use MicroStrategy framework to call tasks.
		try {
			data = JSON.parse(data.responseText);
		} catch (e) {
			data = {};
		}
		;
		// console.log('MSTR.updateActionStage data', data, 'data.rb', data.rb);
		var form = $(bdl.geodash.MSTR.form);
		if (data != undefined && data.rb != undefined) {
			// initialize the last known rb state on all pages
			$("input[name=rb]", window.parent.document).val(data.rb);
			form.find("input[name=rb]").val(data.rb);
		} else if (data != undefined && data.rwb != undefined) {
			$("input[name=rwb]", window.parent.document).val(data.rwb);
			form.find("input[name=rwb]").val(data.rwb);
		}
		// this only needs to happen in report mode
		if (!bdl.geodash.MSTR.isRW()) {
			form.find("input[name=reportID]").val(form.find("input[name=currentReportID]").val());
		}
	},

	getGridBone : function(boneId) {
	    // TODO: This will not be needed anymore. Bones is a deprecated MicroStrategy framework. 
		if (typeof (boneId) == 'undefined') {
			var b = bdl.geodash.MSTR;
		} else {
			var bone = window.top.microstrategy.bones[boneId];
			return bone;
		}

		if (!b.gridBone) {
			b.microstrategy = window.parent.microstrategy;
			b.gridBone = b.microstrategy.bone(b.boneID);

			return b.gridBone;
		} else {
			return b.gridBone;
		}
	},

	makeSelections : function(selections, gd, boneId, selectorArg) {
		//TODO: Update to new visualization framework
		var b = bdl.geodash.MSTR;
		//TODO: cannot use bones anymore.
		if (b.getGridBone(boneId).makeGeodashSelections == undefined) {
			b.getGridBone(boneId).makeGeodashSelections = function(values, attId, selector) {
				// this - a mstrGridRW object
				var sd = this.getSelectionData(attId);
				// sm.el is object keyed by value, with id property for each eg, includes all elements, selected or not:
				// {adams: {id: 'BB:B9BF2B0F44CCACB8F6BB6489219757FB:1:1:0:3:adams'}}
				if (sd && sd.el && values) {
					var ids = [];
					for (var i = 0; i < values.length; i++) {
						ids.push(sd.el[values[i]].id);
					}
					this.makeSelection(ids, attId, null, null, true);
					if (typeof (window.top.gdSelectorFunctions) != "undefined") {
						for (funIndex in window.top.gdSelectorFunctions) {
							window.top.gdSelectorFunctions[funIndex].call(null, ids, attId);
						}
					}
				}
			}
		}
		var selector = gd.base.get('selector');
		if (selectorArg != undefined) {
			selector = selectorArg;
		}

		b.getGridBone(boneId).makeGeodashSelections(selections, selector);
	},

	init : function(boneID) {
		//TODO: Need to find a different identifier as bones can not be used any longer.
		bdl.geodash.MSTR.boneID = boneID;//
	}
}
