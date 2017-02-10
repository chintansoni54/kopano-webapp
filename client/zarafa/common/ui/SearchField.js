Ext.ns('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.SearchField
 * @extends Ext.form.TwinTriggerField
 * @xtype zarafa.searchfield
 *
 * This class can be used to construct a search field with start and stop buttons and we can listen
 * for events to do search specific processing. this search can be local or remote so it is abstracted
 * away from this component.
 */
Zarafa.common.ui.SearchField = Ext.extend(Ext.form.TwinTriggerField, {

	/**
	 * @cfg {String} searchIndicatorClass The CSS class which must be applied to the {@link #el}
	 * during {@link #updateEditState} to indicate that the field is busy searching.
	 */
	searchIndicatorClass : 'zarafa-tbar-loading',

	/**
	 * @cfg {Boolean} renderedSearchPanel The renderedSearchPanel indicates that 
	 * {@link Zarafa.advancesearch.dialogs.SearchContentPanel search content panel} 
	 * was rendered or not. it will gets true if {@link Zarafa.advancesearch.dialogs.SearchContentPanel search content panel} 
	 * renders else false.
	 */
	renderedSearchPanel : false,

	/**
	 * @cfg {Number} minListWidth The minimum width of the dropdown list in pixels (defaults to <tt>70</tt>, will
	 * be ignored if <tt>{@link #listWidth}</tt> has a higher value)
	 */
	minListWidth : 70,

	/**
	 * @cfg {String/Array} listAlign A valid anchor position value. See <tt>{@link Ext.Element#alignTo}</tt> for details
	 * on supported anchor positions and offsets. To specify x/y offsets as well, this value
	 * may be specified as an Array of <tt>{@link Ext.Element#alignTo}</tt> method arguments.</p>
	 * <pre><code>[ 'tl-bl?', [6,0] ]</code></pre>(defaults to <tt>'tl-bl?'</tt>)
	 */
	listAlign : 'tl-bl?',

	/**
	 * @cfg {Boolean/String} shadow <tt>true</tt> or <tt>"sides"</tt> for the default effect, <tt>"frame"</tt> for
	 * 4-way shadow, and <tt>"drop"</tt> for bottom-right
	 */
	shadow : 'sides',

	/**
	 * @cfg {String} selectedClass CSS class to apply to the selected item in the dropdown list
	 * (defaults to <tt>'x-combo-selected'</tt>)
	 */
	selectedClass : 'x-combo-selected',

	/**
	 * @cfg {String} displayField The underlying {@link Ext.data.Field#name data field name} to bind to this
	 * search folder combo box. default is name
	 */
	displayField : 'name',

	/**
	 * @cfg {String} valueField The underlying {@link Ext.data.Field#name data value name} to bind to this
	 * search folder ComboBox. default is value.
	 */
	valueField : 'value',

	/**
	 * @cfg {Mixed} value A value to initialize this field with (defaults to undefined).
	 */
	folderComboBoxValue : undefined,

	/**
	 * @cfg {Zarafa.core.ContextModel} model The model for which this search field bind (defaults to undefined).
	 */
	model : undefined,

	/**
	 * @cfg {String} errorMsgEmpty The error text to display if the search query is empty.
	 */
	errorMsgEmpty : _('Please enter text to start search.'),

	/**
	 * @cfg {Ext.data.JsonStore} store which holds the {@link Ext.data.Record folder} on which
	 * search get's performed.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(config, {
			validationEvent : false,
			validateOnBlur : false,
			emptyText : _('Search in..'),
			cls: 'zarafa-searchfield',
			triggerClass : 'icon_search',
			model : config.model
		});

		this.addEvents(
			/**
			 * @event beforestart
			 * Handler will be called when user has clicked on start trigger (trigger2),
			 * and function is about to begin its execution.
			 * event handler can return false to abort further execution.
			 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
			 * @return {Boolean} false to prevent the search from starting
			 */
			'beforestart',
			/**
			 * @event start
			 * Handler will be called when user has clicked on start trigger (trigger2),
			 * and function has already been executed. This event can be used to actually
			 * start search operation on a {@link Zarafa.core.data.ListModuleStore ListModuleStore}.
			 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
			 */
			'start',
			/**
			 * @event beforereset
			 * Handler will be called when user has clicked on stop trigger (trigger1),
			 * and function is about to begin its execution.
			 * event handler can return false to abort further execution.
			 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
			 * @return {Boolean} false to prevent the search from stopping
			 */
			'beforestop',
			/**
			 * @event reset
			 * Handler will be called when user has clicked on stop trigger (trigger1),
			 * and function has already been executed. This event can be used to stop
			 * search process on {@link Zarafa.core.data.ListModuleStore ListModuleStore}
			 * and reload with normal data.
			 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
			 */
			'stop'
		);

		Zarafa.common.ui.SearchField.superclass.constructor.call(this, config);
	},

	/**
	 * Initialises the component.
	 * This will listen to some special key events registered on the Trigger Field
	 * @protected
	 */
	initComponent : function()
	{
		Zarafa.common.ui.SearchField.superclass.initComponent.call(this);
		this.triggerConfig = {
			tag : 'span',
			cls:'x-form-twin-triggers',
			cn:[{
				tag: "input",
				type: "text",
				size :24,
				autocomplete: "off",
				readonly : true,
				cls : "x-form-text x-form-field zarafa-searchfield-folders x-trigger-noedit"
			},{
				tag: "img",
				src: Ext.BLANK_IMAGE_URL,
				cls: "x-form-trigger " + this.trigger2Class
			},{
				tag: "img",
				src: Ext.BLANK_IMAGE_URL,
				cls: "x-form-trigger " + "icon_search"
			}]
		};
	},

	/**
	 * Initialize events
	 * @private
	 */
	initEvents : function ()
	{
		Zarafa.common.ui.SearchField.superclass.initEvents.apply(this, arguments);
		this.on('specialkey', this.onTriggerSpecialKey, this);
		this.mon(container, 'folderselect', this.onFolderSelect, this);
		this.mon(this.getFolderCombo(), 'blur', this.onBlurSearchComboBox, this, {delay: 10});
		this.mon(this.getFolderCombo(), 'click', this.onClickSelectFolderComboBox, this, {delay: 10});
	},

	/**
	 * Function which is called automatically by ExtJs when the {@link Ext.form.TwinTriggerField TwinTriggerField}
	 * is being rendered. This will create new {@link Ext.data.JsonStore #store} object which holding required
	 * folders. this folders are shows in search folder ComboBox list. Also it will initialize the
	 * search folder combo box list component.
	 *
	 * @param {Ext.Container} ct The parent container for this {@link Ext.form.TwinTriggerField TwinTriggerField}
	 * @param {Number} position The position of this panel inside its parent
	 * @private
	 */
	onRender : function (ct, position)
	{
		Zarafa.common.ui.SearchField.superclass.onRender.apply(this, arguments);
		var subtreeEntryid;
		var defaultStore = container.getHierarchyStore().getDefaultStore();
		if (defaultStore) {
			subtreeEntryid = defaultStore.getSubtreeFolder().get('entryid');
		}
		var folderName;
		var folderEntryid;
		var index = 0;
		var defaultFolder = this.model.getDefaultFolder();
		if (Ext.isDefined(defaultFolder)) {
			folderName = defaultFolder.getDisplayName();
			folderEntryid = defaultFolder.get('entryid');
			if (defaultFolder.getDefaultFolderKey() !== 'inbox') {
				index = 1;
			}
		}

		this.store = new Ext.data.JsonStore({
			idIndex: 0,
			idProperty: 'value',
			fields: ['name', 'value', 'flag'],
			data : [{
				'name' : _('All folders'),
				'value' : subtreeEntryid,
				'flag' : Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.ALL_FOLDERS
			},{
				'name' : Ext.util.Format.htmlEncode(folderName),
				'value' : folderEntryid,
				'flag' : Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.CURRENT_SELECTED_FOLDER
			},{
				'name' : _('Other...'),
				'value' : 'other'
			}],
			autoDestroy: true
		});

		// Initialize the drop down list dom.
		this.initList();

		// If selected folder is public/shared folder in hierarchy then
		// select the second item in search folder ComboBox which is
		// current selected folder in hierarchy by default rather to select
		// "All folders" list item.
		this.select(index,true);
	},

	/**
	 * Function is initialize the triggers component.
	 */
	initTrigger : function()
	{
		Zarafa.common.ui.SearchField.superclass.initTrigger.apply(this, arguments);
		// push the search folder text field object in triggers array.
		var ts = this.trigger.select('.zarafa-searchfield-folders', true);
		this.triggers.push(ts.elements[0]);
	},

	/**
	 * Event handler triggers when lost the focus from search folder ComboBox. it will
	 * collapse the search folder ComboBox list.
	 * @param {Ext.EventObject} event event object for the blur event
	 * @param {Ext.Element} target The element which was focused
	 */
	onBlurSearchComboBox : function (event, target)
	{
		this.collapseIf(event);
	},

	/**
	 * Event handler which is triggered when the context or folder is changed.
	 * Handler is responsible to set/change the current folder in search folder ComboBox list.
	 *
	 * @param {Array} folder selected {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder} objects.
	 * @private
	 */
	onFolderSelect: function (folder)
	{
		if (this.ownerCt instanceof Zarafa.advancesearch.ui.SearchPanelToolbar) {
			return;
		}
		if (Ext.isArray(folder) && !Ext.isEmpty(folder)) {
			folder = folder[0];
		} else {
			return;
		}
		var currentFolder = this.store.getAt(this.store.find('flag', Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.CURRENT_SELECTED_FOLDER));

		currentFolder.beginEdit();
		currentFolder.set("name", folder.getDisplayName());
		currentFolder.set("value", folder.get('entryid'));
		currentFolder.id = folder.get('entryid');
		currentFolder.endEdit();
		currentFolder.commit();

		this.store.reMap(currentFolder);
		//Select 'All folders' by default when the selected folders is from the inbox folder and
		//select current selected folder other than own "Inbox".
		if (folder.getDefaultFolderKey() === 'inbox' && !folder.getMAPIStore().isSharedStore()) {
			var allFolderRecord = this.store.getAt(this.store.find('flag', Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.ALL_FOLDERS));
			this.setFolderComboValue(allFolderRecord.get('value'));
		} else {
			this.setFolderComboValue(folder.get('entryid'));
		}

		this.view.refresh();
	},

	/**
	 * Event handler which is fired when the {@link Ext.EventObjectImp#ENTER} key was pressed,
	 * if the {@link #getValue value} is non-empty this will equal pressing the
	 * {@link #onTrigger1Click 'stop'} button, otherwise this will equal pressing the
	 * {@link #onTrigger2Click 'search'} button.
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Ext.EventObject} e The event for this event
	 * @private
	 */
	onTriggerSpecialKey : function(field, e)
	{
		if (e.getKey() == e.ENTER) {
			var textValue = this.getValue();
			if (Ext.isEmpty(textValue)) {
				this.stopSearch();
			} else {
				this.onTrigger2Click();
			}
		}
	},

	/**
	 * Function handler function that will be used to stop search process.
	 * it will fire {@link #stop} event, that can be used to stop actual search process.
	 * other component can also do pre-processing before stop search process using
	 * {@link #beforestop} event.
	 * @protected
	 */
	stopSearch : function()
	{
		if (this.fireEvent('beforestop', this) !== false) {
			this.doStop();
			this.fireEvent('stop', this);
		}
	},

	/**
	 * Trigger handler function that will be used to start search process.
	 * it will fire {@link #start} event, that can be used to start actual search process.
	 * other component can also do validation before starting search process using
	 * {@link #beforestart} event.
	 * @protected
	 */
	onTrigger2Click : function()
	{
		if (this.fireEvent('beforestart', this) !== false) {
			if (Ext.isEmpty(this.getValue())) {
				container.getNotifier().notify('error.search', _('Error'), this.errorMsgEmpty);
				return false;
			}

			if (!this.isRenderedSearchPanel()) {
				var componentType = Zarafa.core.data.SharedComponentType['common.search'];
				Zarafa.core.data.UIFactory.openLayerComponent(componentType, [], {
					'searchText' : this.getValue(),
					'parentSearchField' : this
				});
			}

			this.doStart();
			this.fireEvent('start', this);
		}
	},

	/**
	 * Function is used to identify whether search folder combo box list is currently expanded or not.
	 * @returns {Boolean} true if search folder combo box list is expanded else false
	 */
	isExpanded : function()
	{
		return this.list && this.list.isVisible();
	},

	/**
	 * Event handler triggers when click on search folder combo box. it will toggle the search folder
	 * ComboBox list.
	 */
	onClickSelectFolderComboBox : function ()
	{
		this.onTrigger1Click();
	},
	
	/**
	 * Event handler call when trigger component get's clicked.
	 * Handler is responsible to toggle the ComboBox list.
	 */
	onTrigger1Click : function()
	{
		if (this.isExpanded()){
			this.collapse();
		} else {
			this.list.show();
			this.mon(Ext.getDoc(), {
				scope: this,
				mousewheel: this.collapseIf,
				mousedown: this.collapseIf
			});
			this.restrictHeight();
		}
		this.getFolderCombo().focus();
	},

	/**
	 * Function is responsible to restrict height of the search folder ComboBox list.
	 */
	restrictHeight : function()
	{
		var inner = this.innerList.dom;
		var pad = this.list.getFrameWidth('tb');
		var h = Math.max(inner.clientHeight, inner.offsetHeight, inner.scrollHeight);

		this.innerList.setHeight(h);
		this.list.beginUpdate();
		this.list.setHeight(h+pad);
		this.list.alignTo.apply(this.list, [this.getFolderCombo()].concat(this.listAlign));
		this.list.endUpdate();
	},

	/**
	 * Update this component to display that this component is
	 * currently busy searching.
	 */
	doStart : function()
	{
		this.el.addClass([this.searchIndicatorClass]);
	},

	/**
	 * Update this component to display that this component is currently
	 * no longer searching.
	 */
	doStop : function()
	{
		this.el.removeClass([this.searchIndicatorClass]);
	},

	/**
	 * Function was used to identify that search panel was rendered or not.
	 * @return {Boolean} return true when search panel was rendered else false.
	 */
	isRenderedSearchPanel : function()
	{
		return this.renderedSearchPanel;
	},

	/**
	 * Initialize the combo box list component.
	 */
	initList : function()
	{
		if (!this.list) {
			var cls = 'x-combo-list';
			this.list = new Ext.Layer({
				parentEl : Ext.getDom(Ext.getBody()),
				shadow : this.shadow,
				cls : cls,
				constrain :false
			});

			var lw = Math.max(this.getFolderCombo().getWidth() + this.getTrigger(0).getWidth(), this.minListWidth);
			this.list.setSize(lw, 0);
			this.innerList = this.list.createChild({cls:cls+'-inner'});
			this.mon(this.innerList, 'mouseover', this.onViewOver, this);
			this.innerList.setWidth(lw - this.list.getFrameWidth('lr'));

			if(!this.tpl){
				this.tpl = '<tpl for="."><div class="'+cls+'-item">{' + this.displayField + '}</div></tpl>';
			}

			this.view = new Ext.DataView({
				applyTo: this.innerList,
				tpl: this.tpl,
				singleSelect: true,
				selectedClass: this.selectedClass,
				itemSelector: this.itemSelector || '.' + cls + '-item'
			});
			this.view.bindStore(this.store);
			this.mon(this.view, {
				containerclick : this.onViewClick,
				click : this.onViewClick,
				scope :this
			});
		}
	},

	/**
	 * Event handler triggers when click on the search folder drop down. Handler is also responsible to
	 * open {@link Zarafa.advancesearch.dialogs.SelectFolderContentPanel SelectFolderContentPanel} if
	 * "Other.." option was selected
	 * @param {Boolean} doFocus true to set the focus on search folder combo box.
	 */
	onViewClick : function(doFocus)
	{
		var index = this.view.getSelectedIndexes()[0];
		var record = this.store.getAt(index);
		if (record){
			if (record.get('value') === "other") {
				this.collapse();
				Zarafa.advancesearch.Actions.openSelectSearchFolderDialog({
					searchField : this
				});
			} else {
				this.onSelect(record);
			}
		} else {
			this.collapse();
		}
		if (doFocus !== false) {
			this.getFolderCombo().focus();
		}
	},

	/**
	 * function is used to get the search folder combo box.
	 * @return {Ext.Element} search folder combo box element.
	 */
	getFolderCombo : function()
	{
		return this.getTrigger(2);
	},

	/**
	 * Event handler triggers when folder is selected from the search folder combo box. After selecting
	 * folder from combo box list we close the combo box list.
	 *
	 * @param {Ext.data.Record} record which is selected from search folder combo box list
	 */
	onSelect : function(record)
	{
		this.setFolderComboValue(record.data[this.valueField || this.displayField]);
		this.collapse();
	},

	/**
	 * Sets the specified value into the field.  If the value finds a match, the corresponding record text
	 * will be displayed in the field.  If the value does not match the data value of an existing item,
	 * it will be displayed as the default field text. Otherwise the field will be blank
	 * (although the value will still be set).
	 * @param {String} value The value to match
	 */
	setFolderComboValue : function (value)
	{
		var text = value;
		if (this.valueField){
			var record = this.store.getAt(this.store.findExact(this.valueField, value));
			if (record){
				text = record.data[this.displayField];
			}
		}
		this.getFolderCombo().dom.value = text;
		this.folderComboBoxValue = value;
	},

	/**
	 * Returns the currently selected {@link #folderComboBoxValue}field value.
	 * @return {String} value The selected value
	 */
	getFolderComboValue : function ()
	{
		return this.folderComboBoxValue;
	},

	/**
	 * Hide search folder combo box list if it is currently expanded.
	 */
	collapse : function()
	{
		if (!this.isExpanded()) {
			return;
		}
		this.list.hide();
		Ext.getDoc().un('mousewheel', this.collapseIf, this);
		Ext.getDoc().un('mousedown', this.collapseIf, this);
	},

	/**
	 * Event handler triggers when {@link #view} gets over. Also it will set the {@link #selectedClass} css class
	 * to indicate the selection.
	 *
	 * @param {Ext.EventObject} event Triggered event object
	 * @param {Ext.Element} target Targeted element.
	 */
	onViewOver : function(event, target)
	{
		var item = this.view.findItemFromChild(target);
		if (item) {
			var index = this.view.indexOf(item);
			this.select(index, false);
		}
	},

	/**
	 * Select an item in the dropdown list by its numeric index in the list.
	 * @param {Number} index The zero-based index of the list item to select
	 * @param {Boolean} scrollIntoView False to prevent the dropdown list from autoscrolling to display the
	 * selected item if it is not currently in view (defaults to true)
	 */
	select : function(index, scrollIntoView)
	{
		this.view.select(index);
		if (scrollIntoView !== false) {
			var element = this.view.getNode(index);
			if (element) {
				this.innerList.scrollChildIntoView(element, false);
				this.onSelect(this.store.getAt(index));
			}
		}
	},

	/**
	 * Collapse the search folder combo box list if search text field is not destroyed and event is not triggered by
	 * parent container/wrapper/combo box list, or click/selection performed on combo box list.
	 * @param {Ext.EventObject} event Triggered event object
	 */
	collapseIf : function(event)
	{
		if ((!this.isDestroyed && !event.within(this.wrap) && !event.within(this.list)) || event.within(this.getEl())) {
			this.collapse();
		}
	},

	/**
	 * Function will destroy the {@link #view} and {@link #list} when search tab or content panel get
	 * close/destroy.
	 */
	onDestroy : function()
	{
		if(Ext.isDefined(this.view) && Ext.isDefined(this.list)) {
			this.view.bindStore(null);
			Ext.destroy(
				this.view,
				this.list
			);
		}
		Zarafa.common.ui.SearchField.superclass.onDestroy.apply(this, arguments);
	}
});

Ext.reg('zarafa.searchfield', Zarafa.common.ui.SearchField);
