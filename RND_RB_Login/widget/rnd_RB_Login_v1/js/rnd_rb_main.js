define(['knockout', 'jquery', 'pubsub', 'ccRestClient', 'koValidate', 'ccPasswordValidator'],
		function (ko, $, pubSub, ccRestClient, koValidate, CCPasswordValidator) {


		var LoginViewModel = function (widget) {
			var self = this;
			
			self.loginValue = ko.observable().extend({
				required: {
				    message: 'Required',
				    params: true
				},
				pattern : {
				    message: 'Not valid email',
				    params: '^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$'
				}
			});
			
			self.passwordValue = ko.observable().extend({
				minLength: {
				    params: 6,
				    message: 'Too short'
				},
	
				maxLength: {
				    params: 16,
				    message: 'Too long'
				},
				required: {
				    params: true,
				    message: 'Required'
				},
			});

			self.login = function (widget) {
				var user = widget.user();
				if (user.loggedIn() && user.emailAddress() == self.loginValue()) {
					widget.loginError(user.firstName() + ' is already logged in.')
				} else {
					if (self.errors().length === 0) {
						publishLogin(widget);
					} else {
						self.errors.showAllMessages();
					}
				}
			};

			self.reset = function () {
				Object.keys(self).forEach(function (name) {
					if (ko.isWritableObservable(self[name])) {
						self[name](undefined);
					}
				});
				self.errors.showAllMessages(false);
			}


			function publishLogin(widget) {
				ccRestClient.login(self.loginValue(), self.passwordValue(),
					// Success
					function () {
						widget.loginError(undefined);
						$.Topic(pubSub.topicNames.USER_LOGIN_SUBMIT).publishWith(widget.user(), [{
							message: "success",
							widgetId: widget.widgetId()
						}]);
					},
					// Error
					function (error) {
						widget.loginError(error.error);
						self.reset();
						$.Topic(pubSub.topicNames.USER_LOGIN_FAILURE).publish(error);
					}
				);
			}
		};

		function initViewModel(widget) {
			var loginViewModel = new LoginViewModel(widget);
			loginViewModel.errors = ko.validation.group(loginViewModel);
			loginViewModel.errors.showAllMessages(false);
			widget.loginViewModel = loginViewModel;
		}

		function resourcesLoaded(widget) {
			initViewModel(widget);
		}

		function onLoad(widget) {
			widget.handleLogout = function() {
				widget.user().updateLocalData(widget.user().loggedinAtCheckout(), true);
				$.Topic(pubSub.topicNames.USER_LOGOUT_SUBMIT).publishWith(widget.user(), [{message: "success"}]);
			};
			widget.loginError = ko.observable();
		}

		return {
			onLoad: onLoad,
			resourcesLoaded: resourcesLoaded
		}
	}
);