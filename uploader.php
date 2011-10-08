<?php
	if (function_exists('ini_set') && is_callable('ini_set')) {
		ini_set('display_errors', 'Off');
		error_reporting(E_ERROR | E_WARNING);
		ini_set('error_log', './php_errors.log');
	}	
	include("config.php");

	if ($_FILES["newfile"]["error"] > 0)
	{
		echo json_encode(array("result" => "ERROR", "message" => $_FILES["newfile"]["error"]));
		return;
	}
	else
	{
		$path = $GLOBALS["root_directory"] . DS. $_POST["_path"];
		if (!checkValidPath($path))
		{
			echo json_encode(array("result" => "ERROR", "message" => "Invalid path!"));
			return;
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
				echo json_encode(array("result" => "OK", "path" => getRelativePath($GLOBALS["root_directory"], $target_path)));
			}
			} else {
				echo json_encode(array("result" => "ERROR", "message" => "File upload error! " . $target_path));
			}
		}	
	}	
	
	function checkValidPath($filename) {
		$realpath = realpath($filename);
		$pos = strpos($realpath, $GLOBALS["root_directory"]);
		if ($pos === false)
			return false;
		else
			return true;
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
?>