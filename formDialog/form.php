<?php


if($_POST) {
	header('Content-type: text/plain; charse="utf-8"');
	try {
		
		if(!isset($_POST['firstname']) || empty($_POST['firstname'])) {
			throw new Exception('Vous devez entrer un prénom');
		}
		
		if(!isset($_POST['lastname']) || empty($_POST['lastname'])) {
			throw new Exception('Vous devez entrer un nom de famille');
		}
		
		echo json_encode(array(
			'success' => true,
			'response' => $_POST
		));
		exit();
		
	}catch(Exception $e) {
		echo json_encode(array(
			'success' => false,
			'error' => $e->getMessage()
		));
		exit();
	}
}


?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Untitled Document</title>
</head>

<body>

<form action="?">
	<p>
        <label>Prénom :</label>
        <input type="text" name="firstname" />
    </p>
	<p>
        <label>Nom :</label>
        <input type="text" name="lastname" />
    </p>
</form>


</body>
</html>
