<?php
	if (function_exists('ini_set') && is_callable('ini_set')) {
		ini_set('display_errors', 'Off');
		error_reporting(E_ERROR | E_WARNING);
		ini_set('error_log', './php_errors.log');
	}	

	include("config.php");
	
	$root = realpath($GLOBALS["root_directory"]);
		
	if (isset($_FILES["newfile"]))
	{
		//File upload
		if ($_FILES["newfile"]["error"] > 0)
		{
			echo json_encode(array("result" => "ERROR", "message" => $_FILES["newfile"]["error"]));
			exit;
		}
		else
		{
			$path = $root . DS. $_POST["_path"];
			if (!checkValidPath($path))
			{
				echo json_encode(array("result" => "ERROR", "message" => "Invalid path!"));
				exit;
			}
			
			if (is_file($path))
				$path = pathinfo($path, PATHINFO_DIRNAME);
			$path .= DS;
			
			if (is_dir($path))
			{
				$target_path = $path .  basename( $_FILES['newfile']['name']);
				if(@move_uploaded_file($_FILES['newfile']['tmp_name'], $target_path)) {
				{
					chmod($target_path, $GLOBALS["default_permission"]);
					echo json_encode(array("result" => "OK", "path" => getRelativePath($root, $target_path)));
				}
				} else {
					echo json_encode(array("result" => "ERROR", "message" => "File upload error! " . $target_path));
				}
			}	
		}
		exit;		
	}	
	
	if (isset($_POST["func"]))
	{
		$func = $_POST["func"];
		switch($func)
		{
			case "fileList": GenerateFileList(); break;
			case "loadFile": LoadFile(); break;
			case "newFolder": NewFolder(); break;
			case "newFile": NewFile(); break;
			case "save": SaveFile(); break;
			case "saveAs": SaveAsFile(); break;
			case "rename": RenameFileFolder(); break;
			case "delete": DeleteFileFolder(); break;
		
		}
	}

	function checkFileName($filename) {
		return (preg_match('/^[^\/\?\*:;{}\\\\]+$/', $filename) > 0);
	}
	
	function checkValidPath($filename) {
		global $root;
		$realpath = realpath($filename);
		$pos = strpos($realpath, $root);
		if ($pos === false)
			return false;
		else
			return true;
	}
	
	function RenameFileFolder() {
		global $root;
		if (isset($_POST["path"]) && isset($_POST["name"]))
		{
			$path = $root . DS . $_POST["path"];
			$newName = $_POST["name"];
			if (!checkFileName($newName) || !checkValidPath($path))
			{
				echo json_encode(array("result" => "ERROR", "message" => "Invalid filename!"));
				return;
			}
			
			$basePath = pathinfo($path, PATHINFO_DIRNAME);
			$oldName = pathinfo($path, PATHINFO_FILENAME);
			
			if (is_dir($path) || is_file($path))
			{
				rename($path, $basePath . DS . $newName);
				echo json_encode(array("result" => "OK", "path" => getRelativePath($root, $basePath . DS . $newName)));
			}
		}
	}
	
	function rrmdir($dir) { 
		global $root;
   	    if (is_dir($dir)) { 
		  $objects = scandir($dir); 
		  foreach ($objects as $object) { 
		    if ($object != "." && $object != "..") { 
			  if (filetype($dir."/".$object) == "dir") rrmdir($dir."/".$object); else unlink($dir."/".$object); 
		    }  
		  } 
		  reset($objects); 
		  rmdir($dir); 
	    } 
	}	

	function DeleteFileFolder() {
		global $root;
		if (isset($_POST["path"]))
		{
			$path = $root . DS. $_POST["path"];
			if (!checkValidPath($path))
			{
				echo json_encode(array("result" => "ERROR", "message" => "Invalid path!"));
				return;
			}
			
			if (is_file($path))
			{
				unlink($path);
				echo json_encode(array("result" => "OK"));
			} else if (is_dir($path))
			{
				rrmdir($path);
				echo json_encode(array("result" => "OK"));
			}
		}
	}	
	
	function LoadFile() {
		global $root;
		if (isset($_POST["filename"]))
		{
			$filename = $root . DS. $_POST["filename"];
			if (file_exists($filename))
			{
				if (!checkValidPath($filename))
				{
					echo "ERROR: Invalid path!";
					exit;
				}
			
				echo file_get_contents($filename);
			}
		}
	}
	
	function NewFolder() {
		global $root;
		if (isset($_POST["path"]) && isset($_POST["name"]))
		{
			$path = $root . DS. $_POST["path"];
			$newName = $_POST["name"];
			if (!checkFileName($newName) || !checkValidPath($path))
			{
				echo json_encode(array("result" => "ERROR", "message" => "Invalid folder name!"));
				return;
			}
			
			if (is_file($path))
				$path = pathinfo($path, PATHINFO_DIRNAME);
			$path .= DS;
			
			if (is_dir($path))
			{
				$newDir = $path . $newName;
				mkdir($newDir, $GLOBALS["default_permission"]);
				echo json_encode(array("result" => "OK"));
			}
		}
	}

	function NewFile() {
		global $root;
		if (isset($_POST["path"]) && isset($_POST["name"]))
		{
			$path = $root . DS. $_POST["path"];
			$newName = $_POST["name"];
			if (!checkFileName($newName) || !checkValidPath($path))
			{
				echo json_encode(array("result" => "ERROR", "message" => "Invalid filename!"));
				return;
			}
			
			if (is_file($path))
				$path = pathinfo($path, PATHINFO_DIRNAME);
			$path .= DS;
			
			if (is_dir($path))
			{
				$newFile = $path . $newName;
    		    if (file_exists($newFile))
    				echo json_encode(array("result" => "ERROR", "message" => "File already exists!"));
    		    else if (file_put_contents($newFile, "") === false)
    				echo json_encode(array("result" => "ERROR", "message" => "File write error!"));
			    else
                {
    				chmod($newFile, $GLOBALS["default_permission"]);
    				//chown($newFile, $GLOBALS["default_owner"]);
    				echo json_encode(array("result" => "OK", "path" => getRelativePath($root, $newFile)));
                }
			}
		}
		
	
	}
	
	function SaveFile() {
		global $root;
		if (isset($_POST["path"]) && isset($_POST["content"]))
		{
			$path = $root . DS . $_POST["path"];
			if (is_file($path))
			{
				if (!checkValidPath($path))
				{
					echo json_encode(array("result" => "ERROR", "message" => "Invalid path!"));
					return;
				}
			    if (file_put_contents($path, $_POST["content"]) === false)
    				echo json_encode(array("result" => "ERROR", "message" => "File write error!"));
			    else
	    			echo json_encode(array("result" => "OK"));
			}
		}
	}	
	
	function SaveAsFile() {
		global $root;
		if (isset($_POST["path"]) && isset($_POST["name"]))
		{
			$path = $root . DS . $_POST["path"];
			$newName = $_POST["name"];
			
			if (is_file($path))
				$newPath = pathinfo($path, PATHINFO_DIRNAME);
			else
				$newPath = $path;
			$newPath .= DS;
			if (!checkFileName($newName) || !checkValidPath($path))
			{
				echo json_encode(array("result" => "ERROR", "message" => "Invalid filename!"));
				return;
			}
			
			if (is_dir($newPath))
			{
				$newFile = $newPath . $newName;
				if (isset($_POST["content"]))
					$content = $_POST["content"];
				else if (is_file($path))
					$content = file_get_contents($path);
					
    		    if (file_put_contents($newFile, $content) === false)
    				echo json_encode(array("result" => "ERROR", "message" => "File write error!"));
			    else
                {
    				chmod($newFile, $GLOBALS["default_permission"]);
    				//chown($newFile, $GLOBALS["default_owner"]);
    				echo json_encode(array("result" => "OK", "path" => getRelativePath($root, $newFile)));
                }
			}
		}
	}	
	
	function GenerateFileList()
	{
		global $root;
		$path = $root. DS;
		if (isset($_POST["root"]) && ($_POST["root"] != "source" && $_POST["root"] != DS))
			$path .=  $_POST["root"] . DS; 
		
		if (!checkValidPath($path))
		{
			echo json_encode(array("result" => "ERROR", "message" => "Invalid path! " . $root));
			exit;
		}
		
		//header('Content-type: application/json');
		$rootfolder = array(
			"text" => "/",
			"expanded" => true,
			"id" => "/",
			"classes" => "folder"
		);
		$result = array();
		$files = scandir($path);
		
		//get directories
		for($i = 0; $i< count($files); $i++)
		{
			$file = $files[$i];
			$fullpath = $path . $file;
			$relpath = getRelativePath($root, $path . $file);
			if ($file == "." || $file == "..") continue;
			if (is_dir($fullpath))
			{
				$result[] = array(
					"text" => $file,
					"hasChildren" => true,
					"id" => $relpath,
					"classes" => "folder"
				);
			}
		}
		
		//get files
		for($i = 0; $i< count($files); $i++)
		{
			$file = $files[$i];
			$fullpath = $path . $file;
			$relpath = getRelativePath($root, $path . $file);
			if ($file == "." || $file == "..") continue;
			$webPath = $GLOBALS["web_root"] . DS . $relpath;
			$icon = "file";
			if (is_file($fullpath))
			{
				$result[] = array(
					"text" => $file,
					"expanded" => false,
					"id" => $relpath,
					"classes" => $icon,
					"hint" => getFileTip($fullpath),
					"webPath" =>  $webPath,
					"root" => $root
				);
			}
		}
		
		if ($_POST["root"] == "source")
		{
			chmod($root, $GLOBALS["default_permission"]);
			
			if (count($result) > 0)
				$rootfolder["children"] = $result;
			echo json_encode(array($rootfolder));
		}
		else
			echo json_encode($result);
	}
	
	function getRelativePath($from, $to)
	{
		$from     = explode('/', $from);
		$to       = explode('/', $to);
		$relPath  = $to;

		foreach($from as $depth => $dir) {
			// find first non-matching dir
			if($dir === $to[$depth]) {
				// ignore this directory
				array_shift($relPath);
			} else {
				// get number of remaining dirs to $from
				$remaining = count($from) - $depth;
				if($remaining > 1) {
					// add traversals up to first matching dir
					$padLength = (count($relPath) + $remaining - 1) * -1;
					$relPath = array_pad($relPath, $padLength, '..');
					break;
				//} else {
				//	$relPath[0] = './' . $relPath[0];
				}
			}
		}
		return implode('/', $relPath);
	}
	
	function getFileTip($fullpath) {
		$size = filesize($fullpath) / 1024;
		$modTime = date(DATE_RFC822, filemtime($fullpath));
		return "Size: " .  sprintf("%01.1f", $size) . "K\nModified: " . $modTime;
	}
?>