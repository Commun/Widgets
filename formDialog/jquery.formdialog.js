// JavaScript Document
	
(function($) {
	
	$.widget( "ui.formDialog", {
		
		options: { 
			'autoOpen' : true,
			'title' : 'Modifier',
			'url' : '',
			'urlPost' : null,
			'javascript' : null,
			'css' : null,
			'formSelector' : 'form',
			'closeOnSuccess' : true,
			'dialogOptions' : {
				'modal' : true,
				'draggable' : false,
				'resizable' : false,
				'width' : 960,
				'height' : $(window).height()-100
			}
		},
		
		_create: function() {
			
			this._normalizeOptions();
			
			this.dialog = this.element;
			
			if(this.options.autoOpen) {
				this.open();
			}
		},
		
		_normalizeOptions : function() {
			
			if(!this.options.urlPost) {
				this.options.urlPost = this.options.url;
			}
			
		},
		
		open: function() {
			
			var url = this.options.url;
			var off = url.indexOf( " " );
			if ( off >= 0 ) {
				var selector = url.slice( off, url.length );
				url = url.slice( 0, off );
			}
			
			$.ajax(this.options.url, {
				'cache' : false,
				'dataType' : 'html',
				'type' : 'get',
				'success' : $.proxy(function(html,textStatus,xhr) {
					html = selector ? $('<div>').append($('<div>').html(html).find(selector)).html():html;
					
					if(this.options.javascript) {
						$.ajax({
							'url' : this.options.javascript,
							'dataType' : 'html',
							'success' : $.proxy(function(data){
								this._build(html);
								eval('(function($dialog){'+data+'}).call(this,this.dialog);');
								this._trigger("open");
							},this)
						});
					} else {
						this._build(html);
						this._trigger("open");
					}
				},this),
				'error' : $.proxy(function(xhr, textStatus, e) {
					
				},this),
				
			});
			
		},
		
		_build: function(html) {
		
			if(!this.dialog) {
				this.dialog = $('<div></div>');
			}
			
			this.dialog.html(html);
			
			if(this.options.css) {
				$.ajax({
					'url' : this.options.css,
					'dataType' : 'html',
					'success' : $.proxy(function(data){
						this.dialog.append('<style type="text/css">'+data+'</style>');
					},this)
				});
			}
			
			this._trigger("build");
			
			this.dialog.dialog(jQuery.extend(this.options.dialogOptions,{
				'title' : this.options.title,
				'buttons' : {
					'Annuler' : $.proxy(this.cancel,this),
					'Enregistrer' : $.proxy(this.submit,this)
				},
				'close' : $.proxy(this.close,this)
				
			}));
			
		},
		
		
		
		submit: function() {
			
			var data = this.dialog.find(this.options.formSelector).serialize();
			
			this.dialog.find('.ui-state-error').remove();
			this.dialog.dialog( "option", "disabled", true );
			
			$.post(this.options.urlPost, data, $.proxy(function(data) {
				
				this.dialog.dialog( "option", "disabled", false );
				
				if(this._isSuccess(data)) {
					this._trigger('success', null, {
						'data' : this._getResponse(data)
					});
					if(this.options.closeOnSuccess) {
						this.close();
					}
				} else {
					this._error(data.error);
					this._trigger('error', null, {
						'data' : this._getError(data)
					});
				}
				
			},this),'json');
			
			this._trigger('submit',null,{
				'data' : data
			});
			
		},
		
		_isSuccess : function(data) {
			return data.success;
		},
		
		_getResponse : function(data) {
			return data.response;
		},
		
		_getError : function(data) {
			return data.error;
		},
		
		_error: function(errors) {
			
			//var html = '<p>Votre formulaire contient des erreurs</p>';
			var html = '';
			if(typeof(errors) == 'string') {
				html += '<p>'+errors+'</p>';
			} else if(errors.length) {
				html += '<ul>';
				for(var i = 0; i < errors.length; i++) {
					html += '<li>'+errors[i]+'</li>';
				}
				html += '</ul>';
			}
			
			/*this.dialog.prepend('<div class="ui-state-error">'+html+'</div>');
			this.dialog.animate({'scrollTop':'0'},500);*/
			
			$('<div></div>').html(''+html).dialog({
				'modal' : true,
				'draggable' : false,
				'resizable' : false,
				'width' : 500,
				'dialogClass' : 'ui-state-error',
				'title' : '<span class="ui-icon ui-icon-alert" style="float:left; margin:3px 10px 0 0;"></span> Votre formulaire contient des erreurs',
				'buttons' : {
					'Ok' : function() {
						$(this).dialog('close');
					}
				},
				'close' : function() {
					$(this).dialog('destroy');
					$(this).remove();
				}
				
			});
			
		},

		close: function() {
			
			this.dialog.dialog('destroy');
			this.dialog.remove();
			this._trigger("close");
			
		},

		cancel: function() {
			
			this._trigger('cancel');
			this.close();
			
		},
		
		widget: function() {
			
			return this.dialog;
			
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
			
			this.dialog.dialog('destroy');
			this.dialog.remove();
			this.dialog = null;
			
			$.Widget.prototype.destroy.call( this );
		}
		
	});
	
}(jQuery));