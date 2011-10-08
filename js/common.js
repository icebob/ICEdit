var hasStorage = supports_local_storage;

function supports_local_storage() {
    try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch(e){
		return false;
	}
}

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function GetUrlParameter( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return results[1];
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function RemoveFromArray(array, obj)
{
	var index = $.inArray(obj, array);
	if (index >= 0)
		array.remove(index);	
}

function nl2br(str)
{
	return str.replace(/\n/g,"<br/>").replace(/\r/g,"");
}

String.format = function(format) {
    for (var i = 1; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+(i-1)+'\\}', 'gi');
        format = format.replace(regexp, arguments[i]);
    }
    return format;
}

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};

function GetFileNameFromPath(path)
{
	var s = path.split("/");
	if (s.length > 0)
		return s[s.length - 1];
	else
		return path;		
}

function ExtractFilePath(filename)
{
    var i = filename.lastIndexOf("/");
    if (i == filename.length)
        return filename;
    else
        return filename.substring(0, i + 1);
}
