(function(w,d){

	function groupScripts() {
		var scripts = getAllScripts();
		var order = 0;
		var scriptObj = {};
		scriptObj.async = [];
		scriptObj.defer = [];
		scriptObj.blocking = [];
		scriptObj.inline = [];

		for (var i = 0; i < scripts.length; i++) {
			order = i + 1;
			if (scripts[i].src) {
				// scripts with async & defer set to true is considered to be async
				if(scripts[i].async) {
					scriptObj.async.push({'name': scripts[i].src, count: order });
				} else if(scripts[i].defer) {
					scriptObj.defer.push({'name': scripts[i].src, count: order });
				} else {
					scriptObj.blocking.push({'name': scripts[i].src, count: order });
				}
			} else {
				// Todo - Indentify dynamically inserted scripts in better way
				if (scripts[i].innerHTML.indexOf('src') <= -1) {
					scriptObj.inline.push({'name': scripts[i].innerHTML, count: order });
				}
			}
		}
		return scriptObj;
	}

	function getAllScripts() {
		return d.getElementsByTagName('script');
	}

	function getScriptsByType(scripts, type) {
		return scripts[type];
	}

	function interleave(asyncScripts, deferScripts) {
	  	var asyncPointer = 0;
	  	var deferPointer = 0;
	  	var newArr = [];
	  	var asyncEle, deferEle;
	  
	  	while (asyncPointer < asyncScripts.length) {
		    asyncEle = asyncScripts[asyncPointer];
		    deferEle = deferScripts[deferPointer];

		    if (!!deferEle) {
		    	if (asyncEle.duration < deferEle.duration) {
					newArr.push(asyncEle);
					asyncPointer++;
				} else {
					newArr.push(deferEle);
					deferPointer++;
				}
		    } else {
		    	newArr.push(asyncEle);
		    	asyncPointer++;
		    }
		}
		while (deferPointer < deferScripts.length) {
			newArr.push(deferScripts[deferPointer]);
			deferPointer++;
	    }

	    return newArr;
	}

	function addDurationToScripts(entries, scripts) {
		for (var i = 0; i < entries.length; i++) {
			for(var j = 0; j < scripts.length; j++) {
				if (entries[i].name === scripts[j].name) {
					scripts[j].duration = entries[i].duration;
				}
			}
		}
		return scripts;
	}

	function getScriptOrder() {
		var scripts = groupScripts();
		var inlineScripts = getScriptsByType(scripts, 'inline');
		var blockingScripts = getScriptsByType(scripts, 'blocking');
		var entries = [];
		var orderedScripts = [];
		// Inlinescripts + blockingscripts sorted by order 
		orderedScripts = inlineScripts.concat(blockingScripts).sort(function(a,b){return a.count - b.count});

		// Async Scripts Order - can be easily measured using Resource Timing API
		var asyncScripts = getScriptsByType(scripts, 'async');

		// Defer Scripts - Ordered execution
		var deferredScripts = getScriptsByType(scripts, 'defer');

		if(w.performance && w.performance.getEntriesByType) {
			entries = w.performance.getEntriesByType('resource');

			asyncScripts = addDurationToScripts(entries, asyncScripts);
			deferredScripts = addDurationToScripts(entries, deferredScripts);

			// We need this for interleaving
			asyncScripts.sort(function(a,b){return a.duration - b.duration});
		} else {
			console.log('Async & Defer Script Execution Order will not be measured - No Resource Timing API Support ')
		}
		
		// // We need to interleave async scripts between deferred scripts
		var interleavedScripts = interleave(asyncScripts, deferredScripts);
		orderedScripts = orderedScripts.concat(interleavedScripts);

		console.table(orderedScripts);
	}

	getScriptOrder();

})(window, window.document);