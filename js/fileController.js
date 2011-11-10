
iFileController = function () {
    this.items = [];
	
	this.add = function(fullpath, content) {
		var filename = GetFileNameFromPath(fullpath);
 	    var name = fullpath.split(".");
		var cMode = new iEdit.TextMode();
		var icon = "images/file-icon.png";
 	    if (name.length > 0)
  	    { 
			switch(name[name.length - 1])
			{
				case "css": 	
				{
					cMode = new iEdit.CssMode(); 
					icon = "images/css-icon.png";
					break;
				}
				case "htm":
				case "html": {	
					cMode = new iEdit.HtmlMode(); 
					icon = "images/html-icon.png";
					break;
				}
				case "js": 	{
					cMode = new iEdit.JavaScriptMode(); 
					icon = "images/js-icon.png";
					break;
				}
				case "json": {
					cMode = new iEdit.JsonMode(); 
					icon = "images/js-icon.png";
					break;
				}
				case "coffee": {
					cMode = new iEdit.CoffeeScriptMode(); 
					icon = "images/coffee-icon.png";
					break;
				}
				case "php": {
					cMode = new iEdit.PhpMode(); 
					icon = "images/php-icon.png";
					break;
				}
				case "xml": {
					cMode = new iEdit.XmlMode(); 
					break;
				}
			} 
		}		
		
		var newFile = {
			filename: filename,
			path: fullpath,
			content: content,
			contentMode: cMode,
			icon: icon,
			changed: false,
			cursor: null,
			scrollTop: 0
			
		}
		this.items.push(newFile);
		iEdit.saveToStorage(newFile);

		return newFile;
	}
	
	this.indexOf = function(file) {
		var index = -1;
		$.each(this.items, function(i, item) {
			if (item == file)
			{
				index = i;
				return false;
			}
		});
		return index;
	}
	
	this.indexOfByPath = function(path) {
		var index = -1;
		$.each(this.items, function(i, item) {
			if (item.path == tab.path)
			{
				index = i;
				return false;
			}
		});
		return index;
	}	
	
	this.getFileByPath = function(path) {
		var index = this.indexOfByPath(path);
		if (index != -1)
			return this.items[index];
		else
			return null;
	}

	this.hasUnsavedFile = function() {
		var bRes = false;
		$.each(this.items, function(i, item) {
			if (item.changed)
				bRes = true;
		});
		return bRes;
	}
};
