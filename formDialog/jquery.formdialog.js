// JavaScript Document
	
(function($) {
	
	$.widget( "ui.formDialog", {
		
		options: {
			'title' : 'Modifier',
			'url' : '',
			'urlPost' : null,
			'javascript' : null,
			'css' : null,
			'formSelector' : 'form',
			'autoOpen' : true,
			'closeOnSuccess' : true,
			'displayErrors' : true,
			'dialogOptions' : {
				'modal' : true,
				'draggable' : false,
				'resizable' : false,
				'width' : $(window).width()-200,
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
			
			var dialogOptions = $.extend(this.options.dialogOptions,{
				'title' : this.options.title,
				'buttons' : {},
				'close' : function(self) {
					return function() {
						self.close.apply(self,arguments);
					}
				}(this)
				
			});
			dialogOptions['buttons']['Annuler'] = function(self) {
				return function() {
					$(this).dialog('close');
					self.cancel.apply(self,arguments);
				}
			}(this);
			dialogOptions['buttons']['Enregistrer'] = $.proxy(this.submit,this)
			
			this.dialog.dialog(dialogOptions);
			
		},
		
		submit: function() {
			
			var data = this._getFormData();
			
			this.dialog.find('.ui-state-error').remove();
			this.dialog.dialog( "option", "disabled", true );
			
			this._trigger('beforesubmit',null,{
				'data' : data
			});
			
			$.ajax(this.options.urlPost, {
				'cache' : false,
				'dataType' : 'json',
				'type' : 'post',
				'data' : data,
				'success' : $.proxy(function(response,textStatus,xhr) {
					
					this.dialog.dialog( "option", "disabled", false );
					
					if(this._isSuccessFromPostData(response)) {
						this._trigger('success', null, {
							'data' : this._getResponseFromPostData(response)
						});
						if(this.options.closeOnSuccess) {
							this.close();
						}
					} else {
						var error = this._getErrorFromPostData(response);
						if(this.options.displayErrors) {
							this._displayErrors(error);
						}
						this._trigger('error', null, {
							'error' : error
						});
					}
					
				},this)
			});
			
		},
		
		_isSuccessFromPostData : function(data) {
			return data.success;
		},
		
		_getResponseFromPostData : function(data) {
			return data.response;
		},
		
		_getErrorFromPostData : function(data) {
			return data.error;
		},
		
		_getFormData : function() {
			return this.dialog.find(this.options.formSelector).serialize();
		},
		
		_displayErrors: function(errors) {
			
			var html = this._errorsToHTML(errors);
			
			/*this.dialog.prepend('<div class="ui-state-error">'+html+'</div>');
			this.dialog.animate({'scrollTop':'0'},500);*/
			
			var alertIcon = '<span class="ui-icon ui-icon-alert" style="float:left; margin:3px 10px 0 0;"></span>';
			$('<div></div>').html(html).dialog({
				'modal' : true,
				'draggable' : false,
				'resizable' : false,
				'width' : 500,
				'dialogClass' : 'ui-state-error',
				'title' : alertIcon+' Votre formulaire contient des erreurs',
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
		
		_errorsToHTML : function(errors) {
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
			return html;
		},

		close: function() {
			//console.log('close');
			if(this.dialog) {
				this.dialog.dialog('destroy');
				this.dialog.remove();
				this._trigger("close");
			}
			
		},

		cancel: function() {
			
			this._trigger('cancel');
			this.close();
			
		},
		
		widget: function() {
			return this.dialog;
		},
		
		_setOption: function( key, value ) {
			
			switch( key ) {
				case "clear":
					
				break;
			}
			
			$.Widget.prototype._setOption.apply( this, arguments );
			this._super( "_setOption", key, value );
		},
		
		destroy: function() {
			console.log('destroy');
			//this.dialog.dialog('destroy');
			//this.dialog.html('');
			this.dialog = null;
			
			//$.Widget.prototype.destroy.call( this );
		}
		
	});
	
}(jQuery));