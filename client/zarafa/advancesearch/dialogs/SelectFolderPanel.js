Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SelectFolderPanel
 * @extends Ext.Panel
 * @xtype zarafa.selectfolderpanel
 *
 * Panel for users to select the {@link Zarafa.core.data.IPFRecord folder}
 * on which search can perform.
 */
Zarafa.advancesearch.dialogs.SelectFolderPanel = Ext.extend(Ext.Panel, {
	/**
	 * {@link Zarafa.common.ui.SearchField SearchField} which triggers the search operation.
	 * @type Object
	 * @property searchField
	 */
	searchField : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.searchField = config.searchField;
		Ext.applyIf(config, {
			xtype : 'zarafa.selectfolderpanel',
			layout: {
				type: 'fit',
				align: 'stretch'
			},
			border: false,
			header: false,
			items: [
				this.createTreePanel()
			],
			buttonAlign: 'right',
			buttons: [{
				text: _('Ok'),
				handler: this.onOk,
				disabled: true,
				ref: '../okButton',
				cls: 'zarafa-action',
				scope: this
			},{
				text: _('Cancel'),
				disabled: true,
				ref: '../cancelButton',
				handler: this.onCancel,
				scope: this
			}]
		});

		Zarafa.advancesearch.dialogs.SelectFolderPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize events
	 * @private
	 */
	initEvents : function ()
	{
		Zarafa.advancesearch.dialogs.SelectFolderPanel.superclass.initEvents.apply(this, arguments);
		this.mon(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		this.mon(this.hierarchyTree.getSelectionModel(), 'selectionchange', this.onSelectionChange, this);
	},

	/**
	 * Creates a {@link Zarafa.hierarchy.ui.Tree treepanel}
	 * which contains all the {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}
	 * on which search get perform.
	 * @return {Object} Configuration object for the tree panel.
	 * @private
	 */
	createTreePanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'fit',
			border: false,
			flex: 1,
			layoutConfig: {
				align: 'stretch'
			},
			bodyStyle: 'background-color: inherit;',
			items: [{
				xtype: 'zarafa.hierarchytree',
				flex: 1,
				border: true,
				treeSorter: true,
				enableDD : false,
				anchor: '100% 90%',
				ref: '../hierarchyTree'
			}]
		};
	},

	/**
	 * Event handler which is trigggered when the user select a {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	 * from the {@link Zarafa.hierarchy.ui.Tree tree}. This will determine if a valid
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} is selected on which search get's perform.
	 * @param {DefaultSelectionModel} selectionModel The selectionModel for the treepanel
	 * @param {TreeNode} node The selected tree node
	 * @private
	 */
	onSelectionChange : function(selectionModel, node)
	{
		if (!Ext.isDefined(node) || (node.getFolder().isIPMSubTree() && this.objectType == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE)) {
			this.okButton.disable();
			this.cancelButton.disable();
		} else {
			this.okButton.enable();
			this.cancelButton.enable();
		}
	},

	/**
	 * Fired when the {@link Zarafa.hierarchy.ui.Tree Tree} fires the {@link Zarafa.hierarchy.ui.Tree#load load}
	 * event. This function will try to select the {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Zarafa.hierarchy.ui.Tree Tree} intially. When the given node is not loaded yet, it will try again
	 * later when the event is fired again.
	 *
	 * @private
	 */
	onTreeNodeLoad : function()
	{
		// Select folder in hierarchy tree.
		var folder = container.getHierarchyStore().getFolder(this.searchField.getFolderComboValue());

		// If the folder could be selected, then unregister the event handler.
		if (this.hierarchyTree.selectFolderInTree(folder)) {
			this.mun(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
	},

	/**
	 * Event handler which is triggered when the user presses the ok
	 * {@link Ext.Button button}. This will add selected {@link Zarafa.core.data.IPFRecord folder}
	 * into {@link #store}, if folder is not already exists in {@link #store}.
	 *
	 * @private
	 */
	onOk : function ()
	{
		var folder = this.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();

		if (!Ext.isDefined(folder)) {
			return;
		}

		var store = this.searchField.store;
		var record = store.getAt(store.findExact("value", folder.get('entryid')));
		if (!Ext.isDefined(record)) {
			var importedFolderFlag = Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.IMPORTED_FOLDER;
			if (store.getAt(0).get('flag') === importedFolderFlag) {
				store.removeAt(0);
			}
			record = new Ext.data.Record({
				'name' : folder.get('display_name'),
				'value' : folder.get('entryid'),
				'flag' : importedFolderFlag
			},folder.get('entryid'));
			store.insert(0, record);
		}
		var recordIndex = store.find('value', record.get('value'));
		this.searchField.select(recordIndex, true);
		this.dialog.close();
	},

	/**
	 * Event handler which is triggered when the user presses the cancel
	 * {@link Ext.Button button}. This will close the {@link Zarafa.advancesearch.dialogs.SelectFolderPanel dialog}
	 * without adding any {@link Ext.data.Record records} in search combo box.
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	}
});

Ext.reg('zarafa.selectfolderpanel', Zarafa.advancesearch.dialogs.SelectFolderPanel);
