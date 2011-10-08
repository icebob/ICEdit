var iEdit = {
    editor: null,
	tabs: null,
	files: null,
	fileBrowser: null,
	hoverFile: null,
	hoverTab: null,
	showingfileContextMenu: false,
	showingTabContextMenu: false,
	loadingTab: false,
	loadingState: false,
	storage: null
};

iEdit.refreshFolder = function(path, forceParent) {
	var rows = $("#fileBrowser li");
	var row = null;
	$.each(rows, function(i, item) {
		if ($(item).attr('id') == path)
		{
			row = $(item);
			return false;
		}
	});
	if (row != null)
	{
		if ((row.find("ul").length > 0) && (!forceParent))
			var folder = row;
		else
			var folder = row.parent().parent();
		folder.find('>span').click();
		folder.attr('class', 'hasChildren collapsable');
		folder.find('>span').click();
	}
}

iEdit.createFolder = function(hoverFile) {
	var path = hoverFile.parent().attr('id');
	var newName = prompt("Enter the folder name");
	if (newName)
	{
		var data = {
			func: "newFolder",
			path: path,
			name: newName
		};
		iEdit.ShowProgressDialog("Creating folder...", newName);
		iEdit.callServer(data, function(data) {
			iEdit.CloseProgressDialog();
			data = jQuery.parseJSON(data);
			if (data && data.result == "OK")
			{
				iEdit.refreshFolder(path);
			} else alert(data.message);
		});
	}
}

iEdit.createFile = function(hoverFile) {
	var path = hoverFile.parent().attr('id');
	var newName = prompt("Enter the filename");
	if (newName)
	{
		var data = {
			func: "newFile",
			path: path,
			name: newName
		};
		iEdit.ShowProgressDialog("Creating file...", newName);
		iEdit.callServer(data, function(data) {
			iEdit.CloseProgressDialog();
			data = jQuery.parseJSON(data);
			if (data && data.result == "OK")
			{
				iEdit.refreshFolder(path);
				iEdit.LoadFile(data.path);
			} else alert(data.message);
		});
	}
}

iEdit.saveFile = function(hoverFile) {
	if (typeof(hoverFile) == "string")
		var path = hoverFile;
	else
		var path = hoverFile.parent().attr('id');
		
	var tab = iEdit.tabs.getTabByID(path);
	if (tab != null && tab.file.changed)
	{
		iEdit.ShowProgressDialog("Saving file...", tab.file.filename);
		if (tab == iEdit.tabs.selectedTab && tab.file.changed)
		{
			tab.file.content = iEdit.editor.getSession().getValue();
		}
		var data = {
			func: "save",
			path: path,
			content: tab.file.content
		};
		iEdit.callServer(data, function(data) {	
			iEdit.CloseProgressDialog();
			data = jQuery.parseJSON(data);
			if (data && data.result == "OK")
			{
				if (tab != null)
				{
					tab.file.localCache = false;
					iEdit.fileChanged(tab, false);
					iEdit.saveToStorage(tab.file);
				}
			} else alert(data.message);
		});
	}
}

iEdit.saveAll = function() {
	$.each(iEdit.tabs.items, function(i, tab) {
		if (tab.file.changed)
			iEdit.saveFile(tab.file.path);
	});
}

iEdit.saveAsFile = function(hoverFile) {
	if (typeof(hoverFile) == "string")
		var path = hoverFile;
	else
		var path = hoverFile.parent().attr('id');

	var newName = prompt("Enter the new filename");
	if (newName)
	{
		iEdit.ShowProgressDialog("Saving file...", newName);

		var data = {
			func: "saveAs",
			path: path,
			name: newName
		};
		
		var tab = iEdit.tabs.getTabByID(path);
		if (tab != null && tab.file.changed)
		{
			if (tab == iEdit.tabs.selectedTab)
				tab.file.content = iEdit.editor.getSession().getValue();

			data.content = tab.file.content;
		}
		
		iEdit.callServer(data, function(data) {
			iEdit.CloseProgressDialog();
			data = jQuery.parseJSON(data);
			if (data && data.result == "OK")
			{
				if (tab != null)
				{
					iEdit.removeFromStorage(tab.file);
					tab.file.path = data.path;
					tab.id = data.path;
					tab.file.filename = GetFileNameFromPath(data.path);
					tab.file.localCache = false;
					iEdit.fileChanged(tab, false);
					iEdit.saveToStorage(tab.file);
				}
				iEdit.refreshFolder(path);
			} else alert(data.message);
		});
	}
}

iEdit.renameFileFolder = function(hoverFile) {
	var path = hoverFile.parent().attr('id');
	
	if (hoverFile.parent().parent().attr('id') == "fileBrowser")
	{
		alert("Can't rename the Root folder!");
		return false;
	}
	
	var newName = prompt("Enter the new name", hoverFile.text());
	if (newName)
	{
		var data = {
			func: "rename",
			path: path,
			name: newName
		};
		iEdit.ShowProgressDialog("Renaming file...", newName);
		iEdit.callServer(data, function(data) {
			iEdit.CloseProgressDialog();
			data = jQuery.parseJSON(data);
			if (data && data.result == "OK")
			{
				iEdit.refreshFolder(path, true);
				//rename the exists tab
				var tab = iEdit.tabs.getTabByID(path);
				if (tab != null)
				{
					iEdit.removeFromStorage(tab.file);
					tab.file.path = data.path;
					tab.id = data.path;
					tab.file.filename = GetFileNameFromPath(data.path);
					iEdit.fileChanged(tab, tab.file.changed);
					iEdit.saveToStorage(tab.file);
				}
			} else alert(data.message);
		});
	}
}

iEdit.deleteFileFolder = function(hoverFile) {
	var path = hoverFile.parent().attr('id');
	var filename = GetFileNameFromPath(path);
	
	if (hoverFile.parent().parent().attr('id') == "fileBrowser")
	{
		alert("Can't delete the root folder!");
		return false;
	}

	if (confirm("Do you want to delete '" + filename + "'?"))
	{
		var data = {
			func: "delete",
			path: path
		};
		iEdit.ShowProgressDialog("Deleting file...", filename);
		iEdit.callServer(data, function(data) {
			iEdit.CloseProgressDialog();
			data = jQuery.parseJSON(data);
			if (data && data.result == "OK")
			{
				//close tab
				var tab = iEdit.tabs.getTabByID(path);
				if (tab != null)
					iEdit.tabs.closeTab(tab, true);
				iEdit.refreshFolder(hoverFile.parent().parent().parent().attr('id'));
			} else alert(data.message);
		});
	}
}

iEdit.reloadFile = function(hoverFile) {
	if (typeof(hoverFile) == "string")
		var path = hoverFile;
	else
		var path = hoverFile.parent().attr('id');
	var tab = iEdit.tabs.getTabByID(path);
	if (tab != null && (tab.file.changed || tab.file.localCache))
	{
		if (!tab.file.changed || confirm("File is changed! Do you want to reload?"))
		{
			iEdit.tabs.closeTab(tab, true);
			iEdit.LoadFile(path);
			iEdit.saveToStorage(tab.file);

		}
	}
}

iEdit.openInBrowser = function(hoverFile) {
	var treeItem = null;
	if (typeof(hoverFile) == "string")
	{
		$("#fileBrowser li").each(function(i, item) {
			if ($(item).attr('id') == hoverFile)
			{
				treeItem = $(this);
				return false;
			}
		});
	}
	else
		treeItem = hoverFile.parent();
		
	window.open(treeItem.data('data').webPath); 
}


iEdit.LoadFile = function(fullpath, callback) {
	if (iEdit.tabs.indexOfByID(fullpath) == -1)
	{
		var filename = GetFileNameFromPath(fullpath);
		
		iEdit.ShowProgressDialog("Loading file...", filename);
		iEdit.callServer({
				"func": "loadFile",
				"filename": fullpath
			}, function(data) {
				var newFile = iEdit.files.add(fullpath, data);
				newFile.localCache = false;
        	    var tab = {
					title: newFile.filename,
					id: newFile.path,
					icon: newFile.icon,
					file: newFile
				};
				
				iEdit.tabs.addTab(tab, true);
				if (callback)
					callback(newFile);
				iEdit.CloseProgressDialog();
			}
		);				
	} else {
		var tab = iEdit.tabs.getTabByID(fullpath);
		if (tab != null)
			iEdit.tabs.setActive(tab);
	}

}

iEdit.LoadFileFromStorage = function(item, loadContent) {
	if (loadContent) {
	var filename = GetFileNameFromPath(item.path);
	iEdit.ShowProgressDialog("Loading file...", filename);

	var newFile = iEdit.files.add(item.path, item.content);
	newFile.localCache = true;
	newFile.cursor = item.cursor;
	newFile.scrollTop = item.scrollTop;
	var tab = {
		title: filename,
		id: item.path,
		icon: item.icon,
		file: newFile
	};
	
	iEdit.tabs.addTab(tab, !iEdit.loadingState);
	iEdit.fileChanged(tab, item.changed);
	iEdit.CloseProgressDialog();
	} else {
		iEdit.LoadFile(item.path, function(newFile) {
			if (item.cursor)
			{
				newFile.cursor = item.cursor;
				iEdit.editor.gotoLine(newFile.cursor.row + 1);
			}
			if (item.scrollTop)
			{
				newFile.scrollTop = item.scrollTop;
				iEdit.editor.renderer.scrollToRow(newFile.scrollTop);
			}
		});
		
	}
}

iEdit.callServer = function(data, callback) {
	$.ajax({
		url: "filesystem.php",
		data: data,
		type: "post",
		cache: false,
		async: !iEdit.loadingState,
		success: function(data) {
			callback(data);
		}
	});
}

iEdit.ShowProgressDialog = function(Caption, Msg)
{
	if ($("#ProgressDialog").length > 0) $("#ProgressDialog").remove();
	if ($("#ProgressOverlay").length > 0) $("#ProgressOverlay").remove();
	
	var overlay = $("<div id='ProgressOverlay'></div>");
	overlay.appendTo("body").show();
	var progress = $("<div id='ProgressDialog'></div>");
	progress.html("<b>" + Caption + "</b><br/>" + Msg);
//	progress.appendTo("body").slideDown("fast");
	progress.appendTo("body").show();
}

iEdit.CloseProgressDialog = function()
{
	//$("#ProgressDialog").slideUp("fast", function() {
		$("#ProgressDialog").remove();
	//});
	$("#ProgressOverlay").remove();
}

iEdit.fileChanged = function(tab, changed) {
	var prefix = (tab.file.localCache)?"(local) ":"";
	tab.file.changed = changed;
	if (changed)
		iEdit.tabs.setTitle(tab, prefix + tab.file.filename + '*');
	else
		iEdit.tabs.setTitle(tab, prefix + tab.file.filename);
	
}

iEdit.saveContent = function(file, content) {
	file.content = content;
	if (iEdit.loadingTab == false)
	{
		file.cursor = iEdit.editor.getCursorPosition();
		file.scrollTop = iEdit.editor.renderer.getScrollTopRow();
	}
	this.saveToStorage(file);
}

iEdit.saveToStorage = function(file) {
	if (iEdit.storage)
	{
		copiedObject = $.extend({}, file);
		copiedObject.contentMode = null;
		
		iEdit.storage.setObject("iEdit." + file.path, copiedObject);
	}
}

iEdit.loadStateFromStorage = function() {
	iEdit.ShowProgressDialog("Loading last state...");
	iEdit.loadingState = true;
	if (iEdit.storage)
	{
		var activeTab = null;
		var preFiles = [];
		for(var i = 0; i< localStorage.length; i++)
		{
			var key = localStorage.key(i);
			if (key != "activeTab")
			{
				var item = iEdit.storage.getObject(key);
				preFiles.push({
					path: item.path,
					content: item.content,
					changed: item.changed,
					icon: item.icon,
					cursor: $.extend({}, item.cursor || {}),
					scrollTop: item.scrollTop
				});
			} else
				var activeTab = iEdit.storage.getObject(key);
			
		}
		iEdit.storage.clear();
		$.each(preFiles, function(i, item) {
			iEdit.LoadFileFromStorage(item, true);
		});
		
		if (iEdit.tabs.items.length > 0 && activeTab != null) {
			var tab = iEdit.tabs.getTabByID(activeTab);
			if (tab != null)
				iEdit.tabs.setActive(tab);
		}
	}
	iEdit.loadingState = false;
	iEdit.CloseProgressDialog();
}		

iEdit.removeFromStorage = function(file) {
	if (iEdit.storage)
	iEdit.storage.removeObject("iEdit." + file.path);

}

iEdit.uploadFileForm = function(hoverFile) {
	var _path = hoverFile.parent().attr('id');
	var path = _path;
	if (hoverFile.hasClass("folder"))
		path += "/";
	path = ExtractFilePath(path);
	if (path == "")
		path += "/";
	var uploadDiv = $("#uploaderForm");
	uploadDiv.find("#path").val(path);
	uploadDiv.find("#_path").val(_path);
	
	uploadDiv.slideDown("fast");
	uploadDiv.find("form").unbind("submit").submit(function() {
		return AIM.submit(this, {
			'onStart': iEdit.uploadFileStart, 
			'onComplete' : function(data) {
				iEdit.CloseProgressDialog();
				if (data && data != "")
				{
					data = jQuery.parseJSON(data);
					if (data && data.result == "OK")
					{
			//			var path = ExtractFilePath(data.path);
						iEdit.refreshFolder(_path, true);
					} else 
						alert(data.message);
				} else 
					alert("File upload unsuccessfull!");
			}
		});
	});
	uploadDiv.find("#cancelButton").unbind("click").bind("click", function() {
		uploadDiv.slideUp("fast");
	});
}
iEdit.uploadFileStart = function() {
	$("#uploaderForm").slideUp("fast");
	iEdit.ShowProgressDialog("Uploading file...", $("#uploaderForm #newfile").val());
}

iEdit.saveTimerTick = function() {
	if (iEdit.tabs.selectedTab)
		iEdit.saveContent(iEdit.tabs.selectedTab.file, iEdit.editor.getSession().getValue());
}

iEdit.appCloseEvent = function() {
	iEdit.saveTimerTick();
	return true;
}

