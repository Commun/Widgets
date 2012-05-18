// JavaScript Document
	
(function($) {
	
	/*
	 *
	 * Widget
	 *
	 */
	$.widget( "ui.notes", {
		
		options: {
			path : '',
			notesScript : 'notes.php',
			
			renderType : 'Notes (%d{count.total})',
			
			labelAddButton : '+ Add a note',
			labelCloseButton : 'Close',
			labelSaveButton : 'Save',
			labelCancelButton : 'Cancel',
			labelRemoveButton : 'Remove',
			labelAddTitle : 'Add note',
			labelEditTitle : 'Edit note',
			labelRemoveTitle : 'Remove note',
			labelDisplayTitle : 'View notes for %{name}',
			labelNonote : 'No note',
			labelRemoveMessage : 'Are you sure you really want to remove this note?'
		},
		
		_create: function() {
			
			this._normalizeOptions();
			
			//Init element
			var key = this._getKeyFromElement(this.element);
			$.ui.notes.items[key] = {
				'key' : key,
				'element' : this.element,
				'count' : null
			};
			this.element.data(this.namespace+'.notes',this);
			this.element.data(this.namespace+'.notes.item',$.ui.notes.items[key]);
			this._renderElement(this.element);
			this.element.click($.proxy(function(e) {
				e.preventDefault();
				this.open();
			},this));
			
			
			this.refresh();
			
		},
		
		_normalizeOptions: function() {
			
			if(typeof(this.options.renderType) == 'string') {
				this.options.renderType = {
					'type' : 'text',
					'format' : this.options.renderType
				}
			}
			
		},
		
		open: function() {
			
			var data = this.element.data(this.namespace+'.notes.item');
			
			this._callService('getNotes',{
				'key' : data.key
			},$.proxy(function(response) {
				
				this._displayNotes(response.item,response.notes);
				
			},this));
			
		},
		
		add: function() {
			this.edit(null);
		},
		
		edit: function(note) {
			
			this.editDialog = $dialog = $('<div><form action="?" method="post"></form></div>');
			
			$dialog.find('form').append(this._renderForm(note || {}));
			
			var buttons = {};
			//Save
			buttons[this.options.labelSaveButton] = $.proxy(function() {
				var data = {};
				data.key = this.element.data(this.namespace+'.notes.item').key;
				this.editDialog.find('form :input').each(function() {
					data[$(this).attr('name')] = $(this).val();
				});
				this._callService('saveNote',data,$.proxy(function(note) {
					if(this.notesDialog) {
						this._addNote(note);
					}
					this.editDialog.dialog('close');
					this.refresh([this.element.data(this.namespace+'.notes.item').key]);
				},this));
			},this);
			//Save
			buttons[this.options.labelCancelButton] = $.proxy(function() {
				this.editDialog.dialog('close');
			},this);
			
			$dialog.dialog({
				'title' : !note ? this.options.labelAddTitle:this.options.labelEditTitle,
				'width' : 500,
				'resizable' : true,
				'draggable' : true,
				'dialogClass' : this.widgetBaseClass+'-dialog',
				'buttons' : buttons,
				'close' : $.proxy(function() {
					this.editDialog.dialog('destroy');
					this.editDialog.remove();
					this.editDialog = null;
				},this)
			});
			
		},
		
		remove: function(id) {
			
			var buttons = {};
			buttons[this.options.labelRemoveButton] = $.proxy(function(id) {
				return function() {
					
					var data = {
						'id' : id
					};
					this._callService('removeNote',data,$.proxy(function(note) {
						if(this.notesDialog) {
							this._removeNote(note);
						}
						this.removeDialog.dialog('close');
						this.refresh([this.element.data(this.namespace+'.notes.item').key]);
					},this));
					
				}
			}(id),this);
			buttons[this.options.labelCancelButton] = $.proxy(function() {
				this.removeDialog.dialog('close');
			},this);
			this.removeDialog = $dialog = $(
				'<div class="ui-widget">'+
					'<div class="ui-state-highlight ui-corner-all" style="padding: 0 .7em;">'+
						'<p><span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span>'+
						this.options.labelRemoveMessage+'</p>'+
					'</div>'+
				'</div>');
			$dialog.dialog({
				'title' : this.options.labelRemoveTitle,
				'dialogClass' : this.widgetBaseClass+'-dialog',
				'buttons' : buttons,
				'close' : $.proxy(function() {
					this.removeDialog.dialog('destroy');
					this.removeDialog.remove();
					this.removeDialog = null;
				},this)
			});
			
		},
		
		refresh: function(keys) {
			
			//Load data
			if($.ui.notes.refreshTimeout) {
				window.clearTimeout($.ui.notes.refreshTimeout);
				$.ui.notes.refreshTimeout = null;
			}
			
			if(typeof(keys) == 'undefined') {
				keys = this.getKeys();
			}
			
			//refresh data
			$.ui.notes.refreshTimeout = window.setTimeout($.proxy(function(keys) {
				
				return function() {
					//var keys = this.getKeys();
					
					this._callService('getCount',{
						'keys' : keys
					},$.proxy(function(response) {
						
						for(var key in response) {
							var it = $.ui.notes.items[key];
							it.count = response[key];
							var self = it.element.data(this.namespace+'.notes');
							self._renderElement.call(self,it.element);
						}
						
					},this));
				}
				
			}(keys),this),100);
			
		},
		
		_displayNotes: function(it,notes) {
			
			this.notesDialog = $dialog = $('<div><div class="item"></div><div class="list"><ul class="notes"></ul></div></div>');
			
			$dialog.find('.item').append(this._renderItem(it));
			$dialog.data(this.namespace+'.notes.item',it);
			
			if(!notes.length) {
				$dialog.find('.list ul.notes').append(this._renderNonote(it));
			} else {
				for(var i = 0; i < notes.length; i++) {
					this._addNote(notes[i]);
				}
			}
			
			var buttons = {};
			buttons[this.options.labelAddButton] = $.proxy(function() {
				this.add();
			},this);
			buttons[this.options.labelCloseButton] = $.proxy(function() {
				this.notesDialog.dialog('close');
			},this);
			$dialog.dialog({
				'title' : this._template(this.options.labelDisplayTitle,it),
				'width' : 500,
				'resizable' : true,
				'draggable' : true,
				'dialogClass' : this.widgetBaseClass+'-dialog',
				'buttons' : buttons,
				'open' : $.proxy(function() {
					this.notesDialog.find(':button, a').blur();
				},this),
				'close' : $.proxy(function() {
					this.notesDialog.dialog('destroy');
					this.notesDialog.remove();
					this.notesDialog = null;
				},this)
			});
			
		},
		
		_removeNote: function(note) {
			var $list = this.notesDialog.find('.list ul.notes');
			var $current = $list.find('.'+this.widgetBaseClass+'-note-'+note.id);
			if($current.length) {
				$current.remove();
			}
			$list.find('li.last').removeClass('last');
			$list.find('li:last').addClass('last');
			if(!$list.find('li').length) {
				$list.append(this._renderNonote(this.notesDialog.data(this.namespace+'.notes.item')));
			}
		},
		
		_refreshElement: function() {
			
			for(var key in $.ui.notes.items) {
				var $el = $($.ui.notes.items[key].element);
				$el.data(this.namespace+'.notes')._renderElement.call($el.data(this.namespace+'.notes'),$el);
			}
			
		},
		
		_addNote: function(note) {
			var $list = this.notesDialog.find('.list ul');
			
			var $li = $(this._renderNote(note));
			$li.addClass(this.widgetBaseClass+'-note-'+note.id);
			$li.data(this.namespace+'.notes.note',note);
			var $current = $list.find('.'+this.widgetBaseClass+'-note-'+note.id);
			if($current.length) {
				$current.after($li);
				$current.remove();
			} else {
				$list.append($li);
			}
			$list.find('li.last').removeClass('last');
			$list.find('li:last').addClass('last');
			$list.find('li.nonote').remove();
		},
		
		_renderNonote: function(it) {
			return '<li class="nonote last">'+this.options.labelNonote+'</li>';
		},
		
		_renderForm: function(note) {
			
			var options = [];
			for(var i = 0; i < 6; i++) {
				var selected = (typeof(note.priority) != 'undefined' && parseInt(note.priority) == i) ? ' selected="selected"':'';
				options.push('<option value="'+i+'"'+selected+'>'+i+'</option>');
			}
			
			return 	(typeof(note.id) != 'undefined' ? '<input type="hidden" name="id" value="'+note.id+'" />':'')+
					'<div class="field">'+
						'<label>Note :</label>'+
						'<div class="input">'+
							'<textarea name="text">'+(typeof(note.text) != 'undefined' ? note.text:'')+'</textarea>'+
						'</div>'+
					'</div>'+
					'<div class="field">'+
						'<label>Priority :</label>'+
						'<div class="input">'+
							'<select name="priority">'+options.join('')+'</select>'+
						'</div>'+
					'</div>';
		},
		
		_renderItem: function(it) {
			var $li = $('<div></div>');
			$li.text(it.name);
			return $li;
		},
		
		_renderNote: function(note) {
			
			//Markup
			var $li = $('<li></li>');
			
			if(typeof(note.hasRead) != 'undefined' && !parseInt(note.hasRead)) {
				$li.addClass(this.widgetBaseClass+'-unread');
			}
			
			$li.append('<div class="buttons"><a href="#" class="edit"></a><a href="#" class="remove"></a></div>');
			
			var summary = note.text.substr(0,40)+'...';
			
			$li.prepend('<div class="icon"><a href="#"><span class="ui-icon ui-icon-triangle-1-e"></span></a></div>');
			
			var dateParts = note.date.split(' ');
			var date = $.datepicker.parseDate('yy-mm-dd', dateParts[0]);
			var dateText = $.datepicker.formatDate('DD d MM yy', date);
			
			var $label = $('<div class="label"></label>');
			$label.append('<div class="summary"><a href="#">'+summary+'</a></div>');
			$label.append('<div class="infos">'+dateText+' - '+note.author+'</div>');
			$label.append('<div class="text" style="display:none;"><pre>'+note.text+'</pre></div>');
			$li.append($label);
			
			$li.append('<div style="clear:both;"></div>');
			
			//Events
			var $summaryLink = $li.find('.summary a, .icon a');
			$summaryLink.click($.proxy(function(e) {
				e.preventDefault();
				var $note = $(e.target).parents('li').eq(0);
				$note.find('.text').slideDown('fast');
				$note.find('.icon span').removeClass('ui-icon-triangle-1-e');
				$note.find('.icon span').addClass('ui-icon-triangle-1-s');
				
				var id = $note.data(this.namespace+'.notes.note').id;
				this._callService('readNote',{'id':id},$.proxy(function($note) {
					return function() {
					  $note.removeClass(this.widgetBaseClass+'-unread');
					}
				}($note),this));
			},this));
			
			var $editButton = $li.find('.buttons .edit');
			$editButton.button({
				text: false,
				icons: {primary:'ui-icon-pencil'}
			});
			$editButton.click($.proxy(function(e) {
				e.preventDefault();
				var note = $(e.target).parents('li').eq(0).data(this.namespace+'.notes.note');
				this.edit(note);
			},this));
			
			var $removeButton = $li.find('.buttons .remove');
			$removeButton.button({
				text: false,
				icons: {primary:'ui-icon-trash'}
			});
			$removeButton.click($.proxy(function(e) {
				e.preventDefault();
				var note = $(e.target).parents('li').eq(0).data(this.namespace+'.notes.note');
				this.remove(note.id);
			},this));
			
			return $li;
		},
		
		_renderElement: function(el) {
			
			var data = el.data(this.namespace+'.notes.item');
			
			switch(this.options.renderType.type) {
				case 'text':
					el.text(this._template(this.options.renderType.format,data));
				break;
			}
		},
		
		_template: function(format,data) {
			var text = format+'';
			var re = /\%([sd])?\{([^\}]+)\}/gi;
			while(matches = re.exec(format)) {
				var value = this._resolveObject(data,matches[2]);
				switch(matches[1]) {
					case 'd':
						text = text.replace(matches[0],!value ? 0:value);
					break;
					default:
						text = text.replace(matches[0],!value ? '':value);
					break;
				}
			}
			return text;
		},
		
		_resolveObject: function(it,path) {
			var parts = path.split('.');
			
			if(it && typeof(it[parts[0]]) != 'undefined') {
				if(parts.length > 1) {
					var part = parts.shift();
					var currentItem = it[part];
					var currentPath = parts.join('.');
					return this._resolveObject(currentItem,currentPath);
				} else {
					return it[parts[0]];
				}
			} else {
				return null;
			}
		},
		
		getKeys : function() {
			var keys = [];
			for(var key in $.ui.notes.items) {
				keys.push(key);
			}
			return keys;
		},
		
		_callService: function(method,request,success) {
			
			var data = {
				'notes_method' : method,
				'notes_signature': '-'
			};
			for(var key in request) {
				data['notes_'+key] = 
					typeof(request[key]) == 'object' || 
					typeof(request[key]) == 'array' || 
					typeof(request[key]) == 'function' ? JSON.stringify(request[key]):request[key];
			}
			
			$.ajax({
				'url': this._getServiceUrl(),
				'type': 'POST',
				'dataType' : 'json',
				'data': data,
				'success': function(succ) {
					return function(data) {
						if(data.success) {
							succ(data.response)
						} else {
							
						}
					}
				}(success)
			});
		},
		
		_getServiceUrl: function() {
			return this.options.path.length ? this.options.path+'/'+this.options.notesScript:this.options.notesScript;
		},
		
		_getKeyFromElement: function(el) {
			return $(el).attr('data-notes');
		},
		
		// Use the _setOption method to respond to changes to options
		_setOption: function( key, value ) {
			
			switch( key ) {
				case "clear":
					
				break;
			}
			
			$.Widget.prototype._setOption.apply( this, arguments );
			this._super( "_setOption", key, value );
		},
		
		destroy: function() {
			$.Widget.prototype.destroy.call( this );
		}
		
	});
	
	/*
	 *
	 * Globals
	 *
	 */
	$.ui.notes.refreshTimeout = null;
	$.ui.notes.items = {};
	
	
	/*
	 *
	 * JSON
	 *
	 */
	if(typeof(JSON) == 'undefined' || typeof(JSON.stringify) == 'undefined') {
		var JSON;JSON||(JSON={});
		(function(){function k(a){return 10>a?"0"+a:a}function o(a){p.lastIndex=0;return p.test(a)?'"'+a.replace(p,function(a){var c=r[a];return"string"===typeof c?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function m(a,j){var c,d,h,n,g=e,f,b=j[a];b&&("object"===typeof b&&"function"===typeof b.toJSON)&&(b=b.toJSON(a));"function"===typeof i&&(b=i.call(j,a,b));switch(typeof b){case "string":return o(b);case "number":return isFinite(b)?""+b:"null";case "boolean":case "null":return""+b;
		case "object":if(!b)return"null";e+=l;f=[];if("[object Array]"===Object.prototype.toString.apply(b)){n=b.length;for(c=0;c<n;c+=1)f[c]=m(c,b)||"null";h=0===f.length?"[]":e?"[\n"+e+f.join(",\n"+e)+"\n"+g+"]":"["+f.join(",")+"]";e=g;return h}if(i&&"object"===typeof i){n=i.length;for(c=0;c<n;c+=1)"string"===typeof i[c]&&(d=i[c],(h=m(d,b))&&f.push(o(d)+(e?": ":":")+h))}else for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(h=m(d,b))&&f.push(o(d)+(e?": ":":")+h);h=0===f.length?"{}":e?"{\n"+e+f.join(",\n"+
		e)+"\n"+g+"}":"{"+f.join(",")+"}";e=g;return h}}"function"!==typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+k(this.getUTCMonth()+1)+"-"+k(this.getUTCDate())+"T"+k(this.getUTCHours())+":"+k(this.getUTCMinutes())+":"+k(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var q=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		p=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,e,l,r={"\u0008":"\\b","\t":"\\t","\n":"\\n","\u000c":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},i;"function"!==typeof JSON.stringify&&(JSON.stringify=function(a,j,c){var d;l=e="";if(typeof c==="number")for(d=0;d<c;d=d+1)l=l+" ";else typeof c==="string"&&(l=c);if((i=j)&&typeof j!=="function"&&(typeof j!=="object"||typeof j.length!=="number"))throw Error("JSON.stringify");return m("",
		{"":a})});"function"!==typeof JSON.parse&&(JSON.parse=function(a,e){function c(a,d){var g,f,b=a[d];if(b&&typeof b==="object")for(g in b)if(Object.prototype.hasOwnProperty.call(b,g)){f=c(b,g);f!==void 0?b[g]=f:delete b[g]}return e.call(a,d,b)}var d,a=""+a;q.lastIndex=0;q.test(a)&&(a=a.replace(q,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
		"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){d=eval("("+a+")");return typeof e==="function"?c({"":d},""):d}throw new SyntaxError("JSON.parse");})})();
	}
	
}(jQuery));