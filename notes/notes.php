<?php

class NotesService {
	
	public $secret = 'CLE_SECRETE';	//Secret key
	public $debug = true; 			//Debug mode, the signature is not validated
	public $listMethods = true; 	//Allow the listMethods method
	
	public function getCount($data) {
		
		return array(
			'example1' => array(
				'total' => 10,
				'unread' => 1
			),
			'example2' => array(
				'total' => 12,
				'unread' => 3
			)
		);
	}
	
	public function getNotes($data) {
		
		return array(
			'item' => array(
				'name' => 'Example #1'
			),
			'notes' => array(
				array(
					'text' => 'This is a note for example #1',
					'author' => 'Some Author',
					'date' => '2012-05-12 20:31:55'
				)
			)
		);
	}
	
	public function saveNote($data) {
		
		return array(
			'text' => $data['text'],
			'author' => 'Some Author',
			'date' => date('Y-m-d H:i:s')
		);
	}
	
}

require_once 'Buttplug/ButtPlug.php';
ButtPlug::create(new NotesService(),null,array(
	'input_namespace' => 'notes'
));

