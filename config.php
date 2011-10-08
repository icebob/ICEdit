<?php
	define('DS', DIRECTORY_SEPARATOR);
	
	$GLOBALS["root_directory"]  = dirname(__FILE__) . DS . "../";
//	$GLOBALS["root_directory"]  = dirname(__FILE__) . DS . "test";
	$GLOBALS["web_root"]		= "http://icedit.sourceforge.net/icedit-code/test";
	
	$GLOBALS["default_permission"] = 0775;
	$GLOBALS["default_owner"] = "iceapps";
	
?>