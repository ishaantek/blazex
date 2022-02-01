// Workaround to capture Esc key on certain sites
var isOpen = false;
document.onkeyup = (e) => {
	if (e.key == "Escape" && isOpen) {
		chrome.runtime.sendMessage({request:"close-blazex"})
	}
}

$(document).ready(() => {
	var actions = [];
	var isFiltered = false;

	// Append the blazex into the current page
	$.get(chrome.runtime.getURL('/content.html'), (data) => {
		$(data).appendTo('body');

		// Get checkmark image for toast
		$("#blazex-extension-toast img").attr("src", chrome.runtime.getURL("assets/check.svg"));

		// Request actions from the background
		chrome.runtime.sendMessage({request:"get-actions"}, (response) => {
			actions = response.actions;
		});

		// New tab page workaround
		if (window.location.href == "chrome-extension://mpanekjjajcabgnlbabmopeenljeoggm/newtab.html") {
			isOpen = true;
			$("#blazex-extension").removeClass("blazex-closing");
			window.setTimeout(() => {
				$("#blazex-extension input").focus();
			}, 100);
		}
	});

	function renderAction(action, index, keys, img) {
		var skip = "";
		if (action.action == "search" || action.action == "goto") {
			skip = "style='display:none'";
		}
		if (index != 0) {
			$("#blazex-extension #blazex-list").append("<div class='blazex-item' "+skip+" data-index='"+index+"' data-type='"+action.type+"'>"+img+"<div class='blazex-item-details'><div class='blazex-item-name'>"+action.title+"</div><div class='blazex-item-desc'>"+action.desc+"</div></div>"+keys+"<div class='blazex-select'>Select <span class='blazex-shortcut'>⏎</span></div></div>");
		} else {
			$("#blazex-extension #blazex-list").append("<div class='blazex-item blazex-item-active' "+skip+" data-index='"+index+"' data-type='"+action.type+"'>"+img+"<div class='blazex-item-details'><div class='blazex-item-name'>"+action.title+"</div><div class='blazex-item-desc'>"+action.desc+"</div></div>"+keys+"<div class='blazex-select'>Select <span class='blazex-shortcut'>⏎</span></div></div>");
		}
		if (!action.emoji) {
			var loadimg = new Image();
			loadimg.src = action.favIconUrl;

			// Favicon doesn't load, use a fallback
			loadimg.onerror = () => {
				$(".blazex-item[data-index='"+index+"'] img").attr("src", chrome.runtime.getURL("/assets/globe.svg"));
			}
		}
	}

	// Add actions to the blazex
	function populateblazex() {
		$("#blazex-extension #blazex-list").html("");
		actions.forEach((action, index) => {
			var keys = "";
			if (action.keycheck) {
					keys = "<div class='blazex-keys'>";
					action.keys.forEach(function(key){
						keys += "<span class='blazex-shortcut'>"+key+"</span>";
					});
					keys += "</div>";
			}
			
			// Check if the action has an emoji or a favicon
			if (!action.emoji) {
				var onload = 'if ("naturalHeight" in this) {if (this.naturalHeight + this.naturalWidth === 0) {this.onerror();return;}} else if (this.width + this.height == 0) {this.onerror();return;}';
				var img = "<img src='"+action.favIconUrl+"' alt='favicon' onload='"+onload+"' onerror='this.src=&quot;"+chrome.runtime.getURL("/assets/globe.svg")+"&quot;' class='blazex-icon'>";
				renderAction(action, index, keys, img);
			} else {
				var img = "<span class='blazex-emoji-action'>"+action.emojiChar+"</span>";
				renderAction(action, index, keys, img);
			}
		})
		$(".blazex-extension #blazex-results").html(actions.length+" results");
	}

	// Add filtered actions to the blazex
	function populateblazexFilter(actions) {
		isFiltered = true;
		$("#blazex-extension #blazex-list").html("");
		actions.forEach((action, index) => {
			var keys = "";
			if (action.keycheck) {
					keys = "<div class='blazex-keys'>";
					action.keys.forEach(function(key){
						keys += "<span class='blazex-shortcut'>"+key+"</span>";
					});
					keys += "</div>";
			}
			var img = "<img src='"+action.favIconUrl+"' alt='favicon' onerror='this.src=&quot;"+chrome.runtime.getURL("/assets/globe.svg")+"&quot;' class='blazex-icon'>";
			if (action.emoji) {
				img = "<span class='blazex-emoji-action'>"+action.emojiChar+"</span>"
			}
			if (index != 0) {
				$("#blazex-extension #blazex-list").append("<div class='blazex-item' data-index='"+index+"' data-type='"+action.type+"' data-url='"+action.url+"'>"+img+"<div class='blazex-item-details'><div class='blazex-item-name'>"+action.title+"</div><div class='blazex-item-desc'>"+action.url+"</div></div>"+keys+"<div class='blazex-select'>Select <span class='blazex-shortcut'>⏎</span></div></div>");
			} else {
				$("#blazex-extension #blazex-list").append("<div class='blazex-item blazex-item-active' data-index='"+index+"' data-type='"+action.type+"' data-url='"+action.url+"'>"+img+"<div class='blazex-item-details'><div class='blazex-item-name'>"+action.title+"</div><div class='blazex-item-desc'>"+action.url+"</div></div>"+keys+"<div class='blazex-select'>Select <span class='blazex-shortcut'>⏎</span></div></div>");
			}
		})
		$(".blazex-extension #blazex-results").html(actions.length+" results");
	}

	// Open the blazex
	function openblazex() {
		chrome.runtime.sendMessage({request:"get-actions"}, (response) => {
			isOpen = true;
			actions = response.actions;
			$("#blazex-extension input").val("");
			populateblazex();
			$("html, body").stop();
			$("#blazex-extension").removeClass("blazex-closing");
			window.setTimeout(() => {
				$("#blazex-extension input").focus();
				focusLock.on($("#blazex-extension input").get(0));
				$("#blazex-extension input").focus();
			}, 100);
		});
	}

	// Close the blazex
	function closeblazex() {
		if (window.location.href == "chrome-extension://mpanekjjajcabgnlbabmopeenljeoggm/newtab.html") {
			chrome.runtime.sendMessage({request:"restore-new-tab"});
		} else {
			isOpen = false;
			$("#blazex-extension").addClass("blazex-closing");
		}
	}

	// Hover over an action in the blazex
	function hoverItem() {
		$(".blazex-item-active").removeClass("blazex-item-active");
		$(this).addClass("blazex-item-active");
	}

	// Show a toast when an action has been performed
	function showToast(action) {
		$("#blazex-extension-toast span").html('"'+action.title+'" has been successfully performed');
		$("#blazex-extension-toast").addClass("blazex-show-toast");
		setTimeout(() => {
			$(".blazex-show-toast").removeClass("blazex-show-toast");
		}, 3000)
	}

	// Autocomplete commands. Since they all start with different letters, it can be the default behavior
	function checkShortHand(e, value) {
		var el = $(".blazex-extension input");
		if (e.keyCode != 8) {
			if (value == "/t") {
				el.val("/tabs ")
			} else if (value == "/b") {
				el.val("/bookmarks ")
			} else if (value == "/h") {
				el.val("/history ");
			} else if (value == "/r") {
				el.val("/remove ");
			} else if (value == "/a") {
				el.val("/actions ");
			}
		} else {
			if (value == "/tabs" || value == "/bookmarks" || value == "/actions" || value == "/remove" || value == "/history") {
				el.val("");
			}
		}
	}

	// Add protocol
	function addhttp(url) {
			if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
					url = "http://" + url;
			}
			return url;
	}

	// Check if valid url
	function validURL(str) {
		var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
			'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
			'(\\#[-a-z\\d_]*)?$','i'); // fragment locator
		return !!pattern.test(str);
	}

	// Search for an action in the blazex
	function search(e) {
		if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 13 || e.keyCode == 37) {
			return;
		}
		var value = $(this).val().toLowerCase();
		checkShortHand(e, value);
		value = $(this).val().toLowerCase();
		if (value.startsWith("/history")) {
			$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
			$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
			var tempvalue = value.replace("/history ", "");
			var query = "";
			if (tempvalue != "/history") {
				query = value.replace("/history ", "");
			}
			chrome.runtime.sendMessage({request:"search-history", query:query}, (response) => {
				populateblazexFilter(response.history);
			});
		} else if (value.startsWith("/bookmarks")) {
			$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
			$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
			var tempvalue = value.replace("/bookmarks ", "");
			if (tempvalue != "/bookmarks" && tempvalue != "") {
				var query = value.replace("/bookmarks ", "");
				chrome.runtime.sendMessage({request:"search-bookmarks", query:query}, (response) => {
					populateblazexFilter(response.bookmarks);
				});
			} else {
				populateblazexFilter(actions.filter(x => x.type == "bookmark"));
			}
		} else {
			if (isFiltered) {
				populateblazex();
				isFiltered = false;
			}
			$(".blazex-extension #blazex-list .blazex-item").filter(function(){
				if (value.startsWith("/tabs")) {
					$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
					$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
					var tempvalue = value.replace("/tabs ", "");
					if (tempvalue == "/tabs") {
						$(this).toggle($(this).attr("data-type") == "tab");
					} else {
						tempvalue = value.replace("/tabs ", "");
						$(this).toggle(($(this).find(".blazex-item-name").text().toLowerCase().indexOf(tempvalue) > -1 || $(this).find(".blazex-item-desc").text().toLowerCase().indexOf(tempvalue) > -1) && $(this).attr("data-type") == "tab");
					}
				} else if (value.startsWith("/remove")) {
					$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
					$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
					var tempvalue = value.replace("/remove ", "")
					if (tempvalue == "/remove") {
						$(this).toggle($(this).attr("data-type") == "bookmark" || $(this).attr("data-type") == "tab");
					} else {
						tempvalue = value.replace("/remove ", "");
						$(this).toggle(($(this).find(".blazex-item-name").text().toLowerCase().indexOf(tempvalue) > -1 || $(this).find(".blazex-item-desc").text().toLowerCase().indexOf(tempvalue) > -1) && ($(this).attr("data-type") == "bookmark" || $(this).attr("data-type") == "tab"));
					}
				} else if (value.startsWith("/actions")) {
					$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
					$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
					var tempvalue = value.replace("/actions ", "")
					if (tempvalue == "/actions") {
						$(this).toggle($(this).attr("data-type") == "action");
					} else {
						tempvalue = value.replace("/actions ", "");
						$(this).toggle(($(this).find(".blazex-item-name").text().toLowerCase().indexOf(tempvalue) > -1 || $(this).find(".blazex-item-desc").text().toLowerCase().indexOf(tempvalue) > -1) && $(this).attr("data-type") == "action");
					}
				} else {
					$(this).toggle($(this).find(".blazex-item-name").text().toLowerCase().indexOf(value) > -1 || $(this).find(".blazex-item-desc").text().toLowerCase().indexOf(value) > -1);
					if (value == "") {
						$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
						$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
					} else if (!validURL(value)) {
						$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").show();
						$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
						$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"'] .blazex-item-name").html('\"'+value+'\"');
					} else {
						$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
						$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").show();
						$(".blazex-item[data-index='"+actions.findIndex(x => x.action == "goto")+"'] .blazex-item-name").html(value);
					}
				}
			});
		}
		
		$(".blazex-extension #blazex-results").html($("#blazex-extension #blazex-list .blazex-item:visible").length+" results");
		$(".blazex-item-active").removeClass("blazex-item-active");
		$(".blazex-extension #blazex-list .blazex-item:visible").first().addClass("blazex-item-active");
	}

	// Handle actions from the blazex
	function handleAction(e) {
		var action = actions[$(".blazex-item-active").attr("data-index")];
		closeblazex();
		if ($(".blazex-extension input").val().toLowerCase().startsWith("/remove")) {
			chrome.runtime.sendMessage({request:"remove", type:action.type, action:action});
		} else if ($(".blazex-extension input").val().toLowerCase().startsWith("/history")) {
			if (e.ctrlKey || e.metaKey) {
				window.open($(".blazex-item-active").attr("data-url"));
			} else {
				window.open($(".blazex-item-active").attr("data-url"), "_self");
			}
		} else if ($(".blazex-extension input").val().toLowerCase().startsWith("/bookmarks")) {
			if (e.ctrlKey || e.metaKey) {
				window.open($(".blazex-item-active").attr("data-url"));
			} else {
				window.open($(".blazex-item-active").attr("data-url"), "_self");
			}
		} else {
			chrome.runtime.sendMessage({request:action.action, tab:action, query:$(".blazex-extension input").val()});
			switch (action.action) {
				case "bookmark":
					if (e.ctrlKey || e.metaKey) {
						window.open(action.url);
					} else {
						window.open(action.url, "_self");
					}
					break;
				case "scroll-bottom":
					window.scrollTo(0,document.body.scrollHeight);
					showToast(action);
					break;
				case "scroll-top":
					window.scrollTo(0,0);
					break;
				case "navigation":
					if (e.ctrlKey || e.metaKey) {
						window.open(action.url);
					} else {
						window.open(action.url, "_self");
					}
					break;
				case "fullscreen":
					var elem = document.documentElement;
					elem.requestFullscreen();
					break;
				case "new-tab":
					window.open("");
					break;
				case "email":
					window.open("mailto:");
					break;
				case "url":
					if (e.ctrlKey || e.metaKey) {
						window.open(action.url);
					} else {
						window.open(action.url, "_self");
					}
					break;
				case "goto":
					if (e.ctrlKey || e.metaKey) {
						window.open(addhttp($(".blazex-extension input").val()));
					} else {
						window.open(addhttp($(".blazex-extension input").val()), "_self");
					}
					break;
				case "print":
					window.print();
					break;
				case "remove-all":
				case "remove-history":
				case "remove-cookies":
				case "remove-cache":
				case "remove-local-storage":
				case "remove-passwords":
					showToast(action);
					break;
			}
		}

		// Fetch actions again
		chrome.runtime.sendMessage({request:"get-actions"}, (response) => {
			actions = response.actions;
			populateblazex();
		});
	}

	// Customize the shortcut to open the blazex box
	function openShortcuts() {
		chrome.runtime.sendMessage({request:"extensions/shortcuts"});
	}


	// Check which keys are down
	var down = [];

	$(document).keydown((e) => {
		down[e.keyCode] = true;
		if (down[38]) {
			// Up key
			if ($(".blazex-item-active").prevAll("div").not(":hidden").first().length) {
				var previous = $(".blazex-item-active").prevAll("div").not(":hidden").first();
				$(".blazex-item-active").removeClass("blazex-item-active");
				previous.addClass("blazex-item-active");
				previous[0].scrollIntoView({block:"nearest", inline:"nearest"});
			}
		} else if (down[40]) {
			// Down key
			if ($(".blazex-item-active").nextAll("div").not(":hidden").first().length) {
				var next = $(".blazex-item-active").nextAll("div").not(":hidden").first();
				$(".blazex-item-active").removeClass("blazex-item-active");
				next.addClass("blazex-item-active");
				next[0].scrollIntoView({block:"nearest", inline:"nearest"});
			}
		} else if (down[27] && isOpen) {
			// Esc key
			closeblazex();
		} else if (down[13] && isOpen) {
			// Enter key
			handleAction(e);
		}
	}).keyup((e) => {
		if (down[18] && down[16] && down[80]) {
			if (actions.find(x => x.action == "pin") != undefined) {
				chrome.runtime.sendMessage({request:"pin-tab"});
			} else {
				chrome.runtime.sendMessage({request:"unpin-tab"});
			}
			chrome.runtime.sendMessage({request:"get-actions"}, (response) => {
				actions = response.actions;
				populateblazex();
			});
		} else if (down[18] && down[16] && down[77]) {
			if (actions.find(x => x.action == "mute") != undefined) {
				chrome.runtime.sendMessage({request:"mute-tab"});
			} else {
				chrome.runtime.sendMessage({request:"unmute-tab"});
			}
			chrome.runtime.sendMessage({request:"get-actions"}, (response) => {
				actions = response.actions;
				populateblazex();
			});
		} else if (down[18] && down[16] && down[67]) {
			window.open("mailto:");
		}

		down = [];
	});

	// Recieve messages from background
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.request == "open-blazex") {
			if (isOpen) {
				closeblazex();
			} else {
				openblazex();
			}
		} else if (message.request == "close-blazex") {
			closeblazex();
		}
	});

	$(document).on("click", "#open-page-blazex-extension-thing", openShortcuts);
	$(document).on("mouseover", ".blazex-extension .blazex-item:not(.blazex-item-active)", hoverItem);
	$(document).on("keyup", ".blazex-extension input", search);
	$(document).on("click", ".blazex-item-active", handleAction);
	$(document).on("click", ".blazex-extension #blazex-overlay", closeblazex);
});