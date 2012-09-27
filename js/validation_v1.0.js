/* ValidationJS by Terry Hibbert 2012
 * Use at own risk.
 */


if (typeof console == "undefined") { var console = {log:function(){}} }

var Validation = function() {
	var that = this;
	
	this.failed_rules = [];
	this.valid = false;
	
	this.summary_element = null;

	var word_split_pattern = /[ ///\,.!?+|()&\[\]\r\n]+/m;
	var word_match_pattern = /[a-z0-9\-_]+/m;
	var email_match = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
	
	this.types = {};
	this.types.EMPTY = {
		name: 	"EMPTY",
		test:	function(value) {
			return (value != null && value != "" && value.length != 0) ? true : false;
		}
	};
	
	this.types.NUMBER = {
		name: 	"NUMBER",
		test:	function(value) {
			parsedValue = parseFloat(value);
			return (parsedValue && !isNaN(value)) ? true : false;
		}
	};
	
	this.types.NUMBER_BETWEEN = {
		name: 	"NUMBER_BETWEEN",
		test:	function(value, args) {
			parsedValue = parseFloat(value);
			var min = args[0];
			var max = args[1];
			var inclusive = args[2] || true;
			
			if (!isNaN(parsedValue)) {
				if (inclusive) {
					--min;
					++min;
				}
				return (parsedValue > min && parsedValue < max) ? true : false;
			}
			
			return false;
		}
	};
	
	this.types.NUMBER_MIN = {
		name: 	"NUMBER_MIN",
		test:	function(value, args) {
			parsedValue = parseFloat(value);
			var min = args[0];
			var inclusive = args[1] || true;
			
			if (!isNaN(parsedValue)) {
				if (inclusive) {
					--min;
				}
				return (parsedValue > min) ? true : false;
			}
			
			return false;
		}
	};
	
	this.types.NUMBER_MAX = {
		name: 	"NUMBER_MAX",
		test:	function(value, args) {
			parsedValue = parseFloat(value);
			var min = args[0];
			var inclusive = args[1] || true;
			
			if (!isNaN(parsedValue)) {
				if (inclusive) {
					++min;
				}
				return (parsedValue < min) ? true : false;
			}
			
			return false;
		}
	};
	
	this.types.MATCH = {
		name: 	"MATCH",
		test:	function(value, args) {
			return value.match(args[0]);
		}
	};
	
	this.types.EMAIL = {
		name: 	"EMAIL",
		test:	function(value) {
			return value.match(email_match);
		}
	};
	
	this.types.LENGTH_MIN = {
		name: 	"LENGTH_MIN",
		test:	function(value, args) {
			return (value.length >= args[0]) ? true : false;
		}
	};
	
	this.types.LENGTH_MAX = {
		name: 	"LENGTH_MAX",
		test:	function(value, args) {
			return (value.length <= args[0]) ? true : false;
		}
	};
	
	this.types.WORDS_MAX = {
		name: 	"WORDS_MAX",
		test:	function(value, args) {
			var chunks = trim(value).split(word_split_pattern);
			return (chunks.length <= args[0]) ? true : false;
		}
	};
	
	this.types.WORDS_MIN = {
		name: 	"WORDS_MIN",
		test:	function(value, args) {
			var chunks = trim(value).split(word_split_pattern);
			return (chunks.length >= args[0]) ? true : false;
		}
	};
	
	this.rules = [];
	
	this.add = function(target, type, args, message, feedback_element, allow_empty) {
		var rule = {
			target:			target,
			type: 			type,
			args: 			args,
			message:		message,
			feedback_el:	feedback_element,
			allow_empty:	allow_empty || false
		}
		that.rules.push(rule);
	};
	
	this.validate = function(display_feedback) {
		that.valid = true;
		that.failed_rules = [];
		
		for (var i=0, length=that.rules.length; i<length; ++i) {
			var rule = that.rules[i];
			var value = that.get_target_value(rule.target);

			console.log(rule);
			
			/* if (empty is not allowed and (the value is null or the value is zero length)), or the rule doesn't pass... */
			if ((!rule.allow_empty && (value == null || value.length == 0))
				|| !rule.type.test.apply(this, [value, rule.args])
			) {
				that.failed_rules.push(rule);
				that.valid = false;
			}
		}
		
		if (display_feedback) {
			that.clear_feedback();
			that.display_feedback();
			that.display_feedback_summary();
		}

		return that.valid;
	};
	

	this.auto_validate = function(enable) {
		var targets = [];
		
		for (var i=0, length=that.rules.length; i<length; i++) {
			var rule = that.rules[i];
			var nodeName = rule.target.nodeName;
			switch (nodeName) {
			case "INPUT":
				var type = rule.target.type
				switch (type) {
				case "checkbox": case "radio":
					var namedTargets = document.getElementsByName(rule.target.name);
					namedTargets = that.collectionToArray(namedTargets);
					targets = targets.concat(namedTargets);
					break;
					default:
						targets.push(rule.target);
					break;
				}
				break;
			default:
				targets.push(rule.target);
				break;
			}
		}
		
		that.add_change_listeners(targets);
	};
	
	this.collectionToArray = function(collection) {
		var result = [];
		for(var i=0, length=collection.length; i<collection.length; ++i) {
			result.push(collection[i]);
		}
		return result;
	}
	
	this.add_change_listeners = function(targets) {
		for (var i=0, length=targets.length; i<length; ++i) {
			var type = targets[i].type;
			var eventName = (targets[i].type == "checkbox") ? "click" : "change";
			addEvent(targets[i], eventName, function(e) {
				that.validate(true);
			});
		}
	};
	
	this.display_feedback = function() {
		for (var i=0, length=that.failed_rules.length; i<length; i++) {
			var rule = that.failed_rules[i];
			rule.feedback_el.innerHTML += rule.message + "; ";
		}
	};
	
	this.display_feedback_summary = function() {
		if (!that.summary_element) {
			return;
		}
		
		for (var i=0, length=that.failed_rules.length; i<length; i++) {
			var rule = that.failed_rules[i];
			that.summary_element.innerHTML += rule.message + "; ";
		}
	};
	
	this.clear_feedback = function() {
		for (var i=0, length=that.rules.length; i<length; i++) {
			var rule = that.rules[i];
			rule.feedback_el.innerHTML = "";
		}
		
		if (that.summary_element) {
			that.summary_element.innerHTML = "";
		}
	};
	
	this.get_target_value = function(target) {
		var value = null;
		var nodeName = target.nodeName;
		switch (nodeName) {
		case "INPUT":
			value = that.get_input_value(target);
			break;
		case "TEXTAREA":
			value = that.get_text_value(target);
			break;
		case "SELECT":
			value = that.get_select_value(target);
			break;
		}
		
		return value;
	};
	
	this.get_input_value = function(target) {
		var type = target.type;
		switch (type) {
		case "text": case "number": case "password":
			return that.get_text_value(target);
			break;
		case "radio":
			return that.get_radio_value(target);
			break;
		case "checkbox":
			return that.get_checkbox_values(target);
			break;
		}
		return null;
	};
	
	this.get_text_value = function(target) {
		return target.value;
	};
	
	this.get_select_value = function(target) {
		return target.options[target.selectedIndex].value;
	};
	
	this.get_radio_value = function(target) {
		var targetGroup = document.getElementsByName(target.name);
		
	    for (var i=0, length=targetGroup.length; i < length; ++i) {
	        if (targetGroup[i].checked) {
	            return targetGroup[i].value;
	        }
	    }
	    return null;
	};
	
	this.get_checkbox_values = function(target) {
		var targetGroup = document.getElementsByName(target.name);
		
		var values = [];
		
	    for (var i=0, length=targetGroup.length; i < length; ++i) {
	        if (targetGroup[i].checked) {
	        	values.push(targetGroup[i].value);
	        }
	    }
	    
	    return values;
	};
	
	var addEvent = (function () {
			 var setListener;
			 
			return function (el, ev, fn) {
				if (!setListener) {
					if (typeof el.addEventListener != "undefined") {
						setListener = function (el, ev, fn) {
						el.addEventListener(ev, fn, false);
					};
				} else if (typeof el.attachEvent != "undefined") {
					setListener = function (el, ev, fn) {
						el.attachEvent('on' + ev, fn);
					};
				} else {
					setListener = function (el, ev, fn) {
						el['on' + ev] =  fn;
					};
				}
			}
			setListener(el, ev, fn);
		};
	}());
	
	var trim = function (input) {
		input = input.replace(/^\s+/, '');
		for (var i = input.length - 1; i >= 0; i--) {
			if (/\S/.test(input.charAt(i))) {
				input = input.substring(0, i + 1);
				break;
			}
		}
		return input;
	}
}
