/* 
    TODO:   
*/	

function loadEditor() {
	iEdit.editor = ace.edit("editor");
	//editor.setTheme("ace/theme/textmate");
	iEdit.editor.setTheme("ace/theme/crimson_editor");
	
	iEdit.TextMode = require("ace/mode/text").Mode;
	iEdit.CssMode = require("ace/mode/css").Mode;
	iEdit.HtmlMode = require("ace/mode/html").Mode;
	iEdit.JavaScriptMode = require("ace/mode/javascript").Mode;
	iEdit.JsonMode = require("ace/mode/json").Mode;
	iEdit.PhpMode = require("ace/mode/php").Mode;
	iEdit.XmlMode = require("ace/mode/xml").Mode;
	
	iEdit.editor.getSession().setMode(new iEdit.PhpMode());
	iEdit.editor.setReadOnly(true);
	iEdit.editor.setScrollSpeed(4);
	
	var canon = require('pilot/canon');

	canon.addCommand({
		name: 'SaveFile',
		bindKey: {
			win: 'Ctrl-S',
			mac: 'Command-S',
			sender: 'editor'
		},
		exec: function(env, args, request) {
			if (iEdit.tabs.selectedTab != null && iEdit.tabs.selectedTab.file.changed)
				iEdit.saveFile(iEdit.tabs.selectedTab.file.path);
		}
	});
	canon.addCommand({
		name: 'SaveFile',
		bindKey: {
			win: 'Ctrl-Alt-S',
			mac: 'Command-Alt-S',
			sender: 'editor'
		},
		exec: function(env, args, request) {
			if (iEdit.tabs.selectedTab != null && iEdit.tabs.selectedTab.file.changed)
				iEdit.saveAsFile(iEdit.tabs.selectedTab.file.path);
		}
	});
	
	canon.addCommand({
		name: 'SaveFile',
		bindKey: {
			win: 'Ctrl-Shift-S',
			mac: 'Command-Shift-S',
			sender: 'editor'
		},
		exec: function(env, args, request) {
			iEdit.saveAll();
		}
	});
}

function loadFileBrowser() {
	iEdit.fileBrowser = $("#fileBrowser");

	iEdit.fileBrowser.treeview({
		url: "filesystem.php",
		ajax: {
			data: {
				"func": "fileList"
			},
			type: "post",
			cache: false
		}
	});
	
	$(".file").live("click", function() {
		var parent = $(this).parent();
		if (parent.attr('id'))
		{
			iEdit.LoadFile(parent.attr('id'));
		}
	});
	
	$(".file, .folder").live("mouseenter", function() {
		if (!iEdit.showingfileContextMenu)
			iEdit.hoverFile = $(this);
	});

	iEdit.fileContextMenu = $('#fileBrowser').contextMenu(function() {
		if (iEdit.hoverFile)
		{
			var menu1 = {}; menu1[iEdit.hoverFile.text()] = { onclick: function() {}  };
			var menu2 = $.contextMenu.separator;
			var menu3 = {'Open': { onclick: function(menuItem,menu) { 
				iEdit.LoadFile(iEdit.hoverFile.parent().attr('id'));
			}, icon: "images/open_icon.png"  } };
			var menu4 = {'Save': { onclick: function(menuItem,menu) { iEdit.saveFile(iEdit.hoverFile); }, icon: "images/save_icon.png"  } };
			var menu5 = {'Save as': { onclick: function(menuItem,menu) { iEdit.saveAsFile(iEdit.hoverFile); }, icon: "images/save_as_icon.png"  } };
			var menu6 = $.contextMenu.separator;
			var menu7 = {'New file': { onclick: function(menuItem,menu) { iEdit.createFile(iEdit.hoverFile); }, icon: "images/new_file_icon.png"  } };
			var menu8 = {'New folder': { onclick: function(menuItem,menu) { iEdit.createFolder(iEdit.hoverFile);  }, icon: "images/folder_add_icon.png" } };
			var menu9 = $.contextMenu.separator;
			var menu10 = {'Reload': { onclick: function(menuItem,menu) { iEdit.reloadFile(iEdit.hoverFile); }, icon: "images/reload_icon.png"  } };
			var menu11 = {'Rename': { onclick: function(menuItem,menu) { iEdit.renameFileFolder(iEdit.hoverFile); }, icon: "images/rename_icon.png"  } };
			//var menu12 = {'Duplicate': { onclick: function(menuItem,menu) {  }, icon: "images/duplicate_icon.png"  } };
			var menu13 = {'Delete': { onclick: function(menuItem,menu) { iEdit.deleteFileFolder(iEdit.hoverFile); }, icon: "images/delete_icon.png"  } };
			var menu14 = {'Upload file': { onclick: function(menuItem,menu) { iEdit.uploadFileForm(iEdit.hoverFile); }, icon: "images/upload_icon.png"  } };
			var menu15 = $.contextMenu.separator;
			var menu16 = {'Refresh': { onclick: function(menuItem,menu) { iEdit.refreshFolder(iEdit.hoverFile.parent().attr('id')); }, icon: "images/reload_icon.png"  } };
			var menu17 = {'Open in browser': { onclick: function(menuItem,menu) { iEdit.openInBrowser(iEdit.hoverFile); }, icon: ""  } };
			
			if (iEdit.hoverFile.hasClass('file'))
			{
				return [menu1,  menu2, menu3, menu4, menu5, menu6, menu7, menu8, menu9, menu17, menu10, menu11, menu13, menu14, menu15, menu16];
			} else if (iEdit.hoverFile.hasClass('folder'))
			{
				return [menu1, menu2, menu7, menu8, menu9, menu11, menu13, menu14, menu15, menu16];
			}
		}
	}, {theme:'vista',shadow:false, offsetX:5, offsetY: 2,
		showCallback:function() { 
			iEdit.showingfileContextMenu = true; },
		hideCallback:function() { 
			iEdit.showingfileContextMenu = false; }}
	);
	
}

function loadTabs() {
	iEdit.tabs = new $.jIceTabset(".tabContainer", {
		tabWidth: 200,
		onchangeable: function(oldTab, newTab) {
			return true;
		},
		onchanged: function(oldTab, newTab) {
			if (oldTab != null)
			{
				iEdit.saveContent(oldTab.file, iEdit.editor.getSession().getValue());
			}
				
			iEdit.loadingTab = true;
			var file = newTab.file;
			var lastRow = file.cursor?file.cursor.row:0;
			var lastScrollTop = file.scrollTop?file.scrollTop:0;
			var oldState = file.changed;
			
			iEdit.editor.getSession().setValue(file.content); 
			if (file.contentMode)
				iEdit.editor.getSession().setMode(file.contentMode);
			iEdit.editor.setReadOnly(false);
			iEdit.editor.focus();
			
			iEdit.editor.gotoLine(lastRow + 1);
			if (lastScrollTop != 0)
				iEdit.editor.renderer.scrollToRow(lastScrollTop);

			iEdit.fileChanged(iEdit.tabs.selectedTab, oldState);
			iEdit.storage.setObject('activeTab', newTab.id);			
			iEdit.loadingTab = false;
		},
		onclosable: function(tab) {
			if (tab.file.changed)
				return 	bOk = confirm("The '" + tab.file.filename + "' file changed! Do you want to close it?");
			else
				return true;

		},
		onclosed: function(tab) {
			RemoveFromArray(iEdit.files.items, tab.file);
			iEdit.removeFromStorage(tab.file);

			if (iEdit.tabs.items.length == 0)
			{
				iEdit.editor.getSession().setValue("");   
				iEdit.editor.setReadOnly(true);			
			}
		}

	});

	iEdit.tabs.contextMenu = $('.tabContainer').contextMenu(function() {
		if (iEdit.tabs.selectedTab)
		{
			var tab = iEdit.tabs.selectedTab;
			var menu1 = {}; menu1[iEdit.tabs.selectedTab.title] = { onclick: function() {}, icon: tab.file.icon  };
			var menu2 = $.contextMenu.separator;
			var menu3 = {'Open in browser': { onclick: function(menuItem,menu) { iEdit.openInBrowser(tab.file.path); }, icon: ""  } };
			var menu4 = {'Reload': { onclick: function(menuItem,menu) { iEdit.reloadFile(tab.file.path); }, icon: "images/reload_icon.png"  } };
			var menu5 = $.contextMenu.separator;
			var menu6 = {'Close tab': { onclick: function(menuItem,menu) { iEdit.tabs.closeTab(tab);  }, icon: ""  } };
			var menu7 = {'Close all tabs': { onclick: function(menuItem,menu) { iEdit.tabs.closeAllTabs(false); }, icon: ""  } };
			var menu8 = {'Close other tabs': { onclick: function(menuItem,menu) { iEdit.tabs.closeAllTabs(false, tab); }, icon: ""  } };
			var menu9 = $.contextMenu.separator;
			var menu10 = {'Save': { onclick: function(menuItem,menu) { iEdit.saveFile(iEdit.tabs.selectedTab.file.path); }, icon: "images/save_icon.png"  } };
			var menu11 = {'Save as': { onclick: function(menuItem,menu) { iEdit.saveAsFile(iEdit.tabs.selectedTab.file.path); }, icon: "images/save_as_icon.png"  } };
			var menu12 = {'Save all': { onclick: function(menuItem,menu) { iEdit.saveAll(); }, icon: "images/save_icon.png"  } };
			
			return [menu1, menu2, menu3, menu4, menu5, menu6, menu7, menu8, menu9, menu10, menu11, menu12];
		} else return null;
	}, {theme:'vista',shadow:false, offsetX:5, offsetY: 2}
	);	
	
	
	iEdit.editor.getSession().on('change', function() {
		if (iEdit.tabs.selectedTab != null)
		iEdit.fileChanged(iEdit.tabs.selectedTab, true);
	});
}

function loadFileController() {
	iEdit.files = new iFileController();	
}

$(document).ready(function() {
	loadEditor();
	loadFileBrowser();
	loadFileController();
	loadTabs();

	if (hasStorage)
	{
		iEdit.storage = new ShinyCar();
		iEdit.loadStateFromStorage();
	}
	iEdit.saveTimer = $.timer( 60 * 1000, iEdit.saveTimerTick);
});

//$(window).bind("onbeforeunload", iEdit.appCloseEvent);
//$(window).bind("onunload", iEdit.appCloseEvent); 
window.onbeforeunload = function() {
	if (iEdit.files.hasUnsavedFile())
		return "Do you want to exit? There are some unsaved file!";
	else
		return
};
