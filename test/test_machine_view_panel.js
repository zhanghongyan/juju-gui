/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.
This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

describe('machine view panel view', function() {
  var Y, container, machines, machine, models, scaleUpView, scaleUpViewRender,
      services, utils, units, views, view, View;

  function createViewNoUnits() {
    // Create a test-specific view that has no units to start
    return new View({
      container: container,
      db: {
        services: new models.ServiceList(),
        machines: machines,
        units: new models.ServiceUnitList()
      }
    });
  }

  before(function(done) {
    Y = YUI(GlobalConfig).use(['machine-view-panel',
                               'juju-models',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'drop-target-view-extension',
                               'node'], function(Y) {

      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.MachineViewPanelView;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'machine-view-panel');
    // setup machines
    machine = {
      id: '0',
      hardware: {
        disk: 1024,
        mem: 1024,
        cpuPower: 1024,
        cpuCores: 1
      }
    };
    machines = new models.MachineList();
    machines.add([machine]);
    // displayName is set on the machine object in the list; we also need to
    // set it on our standalone model.
    var displayName = machines.createDisplayName(machine.id);
    machine.displayName = displayName;
    // setup unplaced service units
    units = new models.ServiceUnitList();
    units.add([
      {id: 'test/1'}
    ]);
    // setup test services
    services = new models.ServiceList();
    services.add([
      {id: 'test', icon: 'test.svg'},
      {id: 'baz', icon: 'baz.svg'}
    ]);
    // add everything to the view
    view = new View({
      container: container,
      db: {
        services: services,
        machines: machines,
        units: units
      }
    });
  });

  afterEach(function() {
    view.destroy();
    machines.destroy();
    units.destroy();
    services.destroy();
    container.remove(true);
  });

  it('should apply the wrapping class to the container', function() {
    view.render();
    assert.equal(container.hasClass('machine-view-panel'), true);
  });

  it('should render the header widgets', function() {
    view.render();
    assert.equal(container.one('.column .head .title').get('text'),
        'Unplaced units');
  });

  it('should set the initial container header label', function() {
    var label = '0 containers, 0 units';
    view.render();
    assert.equal(view._containersHeader.get('label'), label);
    assert.equal(view._containersHeader.get(
        'container').one('.label').get('text'), label);
  });

  describe('token drag and drop', function() {
    beforeEach(function() {
      view.set('env', {
        addMachines: utils.makeStubFunction({ id: 'foo' }),
        placeUnit: utils.makeStubFunction()
      });
    });

    it('listens for the drag start, end, drop events', function() {
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      assert.equal(onStub.callCount(), 3);
      var onStubArgs = onStub.allArguments();
      assert.equal(onStubArgs[0][0], '*:unit-token-drag-start');
      assert.deepEqual(onStubArgs[0][1], view._showDraggingUI);
      assert.equal(onStubArgs[1][0], '*:unit-token-drag-end');
      assert.deepEqual(onStubArgs[1][1], view._hideDraggingUI);
      assert.equal(onStubArgs[2][0], '*:unit-token-drop');
      assert.deepEqual(onStubArgs[2][1], view._unitTokenDropHandler);
    });

    it('converts the headers to drop targets when dragging', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      view._machinesHeader = { setDroppable: utils.makeStubFunction() };
      view._containersHeader = { setDroppable: utils.makeStubFunction() };
      // unit-drag start handler _showDraggingUI
      onStub.allArguments()[0][1].call(view);
      assert.equal(view._machinesHeader.setDroppable.calledOnce(), true);
      // The user hasn't selected a machine so this header should not be
      // a drop target.
      assert.equal(view._containersHeader.setDroppable.calledOnce(), false);
    });

    it('converts headers to drop targets when machine selected', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      view._machinesHeader = { setDroppable: utils.makeStubFunction() };
      view._containersHeader = { setDroppable: utils.makeStubFunction() };
      view.set('selectedMachine', 1);
      // unit-drag start handler _showDraggingUI
      onStub.allArguments()[0][1].call(view);
      assert.equal(view._machinesHeader.setDroppable.calledOnce(), true);
      // The user selected a machine so this header should be a drop target.
      assert.equal(view._containersHeader.setDroppable.calledOnce(), true);
    });

    it('converts headers to non-drop targets when drag stopped', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      view._machinesHeader = { setNotDroppable: utils.makeStubFunction() };
      view._containersHeader = { setNotDroppable: utils.makeStubFunction() };
      // unit-drag end handler _hideDraggingUI
      onStub.allArguments()[1][1].call(view);
      assert.equal(view._machinesHeader.setNotDroppable.calledOnce(), true);
      assert.equal(view._containersHeader.setNotDroppable.calledOnce(), true);
    });

    it('creates a new machine when dropped on machine header', function() {
      view._unitTokenDropHandler({
        dropAction: 'machine'
      });
      var env = view.get('env');
      assert.deepEqual(env.addMachines.lastArguments()[0], [{
        containerType: undefined,
        parentId: undefined
      }]);
      var placeArgs = env.placeUnit.lastArguments();
      assert.strictEqual(placeArgs[0], null);
      assert.equal(placeArgs[1], 'foo');
    });

    it('creates new container when dropped on container header', function() {
      view.set('selectedMachine', '5');
      view._unitTokenDropHandler({
        dropAction: 'container'
      });
      var env = view.get('env');
      assert.deepEqual(env.addMachines.lastArguments()[0], [{
        containerType: 'lxc',
        parentId: '5'
      }]);
      var placeArgs = env.placeUnit.lastArguments();
      assert.strictEqual(placeArgs[0], null);
      assert.equal(placeArgs[1], 'foo');
    });

    it('creates a new container when dropped on a machine', function() {
      view._unitTokenDropHandler({
        dropAction: 'container',
        targetId: '0'
      });
      var env = view.get('env');
      assert.deepEqual(env.addMachines.lastArguments()[0], [{
        containerType: 'lxc',
        parentId: '0'
      }]);
      var placeArgs = env.placeUnit.lastArguments();
      assert.strictEqual(placeArgs[0], null);
      assert.equal(placeArgs[1], 'foo');
    });

    it('places the unit on an already existing container', function() {
      view._unitTokenDropHandler({
        dropAction: 'container',
        targetId: '0/lxc/1'
      });
      var env = view.get('env');
      // The machine is already created so we don't need to create a new one.
      assert.equal(env.addMachines.callCount(), 0);
      var placeArgs = env.placeUnit.lastArguments();
      assert.strictEqual(placeArgs[0], null);
      assert.equal(placeArgs[1], '0/lxc/1');
    });
  });

  describe('unplaced units column', function() {
    it('should render a list of units', function() {
      view.render();
      var list = container.all('.unplaced .unplaced-unit');
      assert.equal(list.size(), units.size(),
                   'models are out of sync with displayed list');
      list.each(function(item, index) {
        var u = units.item(index),
            id = item.getAttribute('data-id');
        assert.equal(id, u.id, 'displayed item does not match model');
      });
    });

    it('displays a message when there are no unplaced units', function() {
      var view = createViewNoUnits();
      view.render();
      var message = view.get('container').one('.column.unplaced .all-placed');
      assert.equal(message.getStyle('display'), 'block');
    });

    it('doesn\'t show a message when there are no unplaced units', function() {
      view.render();
      var message = view.get('container').one('.column.unplaced .all-placed');
      assert.equal(message.getStyle('display'), 'none');
    });

    it('should add new tokens when units are added', function() {
      view.render();
      var selector = '.unplaced .unplaced-unit',
          list = container.all(selector),
          id = 'test/2';
      assert.equal(list.size(), units.size(),
                   'initial displayed list is out of sync with unplaced units');
      units.add([{ id: id }]);
      list = container.all(selector);
      assert.equal(list.size(), units.size(),
                   'final displayed list is out of sync with unplaced units');
      var addedItem = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(addedItem, null,
                      'unable to find added unit in the displayed list');
    });

    it('should remove tokens when units are deleted', function() {
      view.render();
      var selector = '.unplaced .unplaced-unit',
          list = container.all(selector);
      assert.equal(list.size(), units.size(),
                   'initial displayed list is out of sync with unplaced units');
      units.remove(0);
      list = container.all(selector);
      assert.equal(list.size(), units.size(),
                   'final displayed list is out of sync with unplaced units');
      var deletedSelector = selector + '[data-id="test/1"]';
      var deletedItem = container.one(deletedSelector);
      assert.equal(deletedItem, null,
                   'found the deleted unit still in the list');
    });

    it('should re-render token when a unit is updated', function() {
      view.render();
      var name = 'scooby',
          unitModel = units.revive(0),
          id = unitModel.get('id'),
          selector = '.unplaced .unplaced-unit[data-id="{id}"]',
          item;
      selector = Y.Lang.sub(selector, {id: id});
      item = container.one(selector);
      assert.notEqual(item, null, 'unit was not initially displayed');
      unitModel.set('displayName', name);
      item = container.one(selector);
      assert.notEqual(item, null, 'unit was not displayed post-update');
      assert.equal(name, item.one('.title').get('text').trim(),
                   'unit did not have the updated name');
    });
  });


  describe('machine column', function() {
    it('should render a list of machines', function() {
      view.render();
      var list = container.all('.machines .content li');
      assert.equal(list.size(), machines.size(),
                   'models are out of sync with displayed list');
      list.each(function(item, index) {
        var m = machines.item(index);
        assert.equal(item.one('.title').get('text'), m.displayName,
                     'displayed item does not match model');
      });
    });

    it('should set the correct machine count in the header', function() {
      var label = '1 machine';
      view.render();
      assert.equal(view._machinesHeader.get('label'), label);
      assert.equal(view._machinesHeader.get(
          'container').one('.label').get('text'), label);
    });

    it('should add new tokens when machines are added', function() {
      view.render();
      var selector = '.machines .token',
          list = container.all(selector),
          id = '1';
      assert.equal(list.size(), machines.size(),
                   'initial displayed list is out of sync with machines');
      machines.add([{
        id: id,
        parentId: null,
        hardware: {
          disk: 1024,
          mem: 1024,
          cpuPower: 1024,
          cpuCores: 1
        }
      }]);
      list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'final displayed list is out of sync with machines');
      var addedItem = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(addedItem, null,
                      'unable to find added machine in the displayed list');
    });

    it('should remove tokens when machines are deleted', function() {
      view.render();
      var selector = '.machines .token',
          list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'initial displayed list is out of sync with machines');
      machines.remove(0);
      list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'final displayed list is out of sync with machines');
      var deletedSelector = selector + '[data-id="' + machine.id + '"]';
      var deletedItem = container.one(deletedSelector);
      assert.equal(deletedItem, null,
                   'found the deleted machine still in the list');
    });

    it('should re-render token when machine is updated', function() {
      view.render();
      var id = 999,
          machineModel = machines.revive(0),
          selector = '.machines .token',
          item = container.one(
              selector + '[data-id="' + machineModel.get('id') + '"]');
      assert.notEqual(item, null, 'machine was not initially displayed');
      assert.equal(
          item.one('.title').get('text'), machineModel.get('displayName'),
          'initial machine names do not match');
      machineModel.set('id', id);
      item = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(item, null, 'machine was not displayed post-update');
      assert.equal(
          item.one('.title').get('text'), machineModel.get('displayName'),
          'machine names do not match post-update');
    });

    it('should set the correct counts in the container header', function(done) {
      var label = '2 containers, 1 unit';
      view.render();
      var machineToken = container.one('.machines li .token');
      machines.add([
        {id: '0/lxc/1'},
        {id: '0/lxc/2'}
      ]);
      // Add a unit to the machine.
      view.get('db').units.add([{id: 'test/2', machine: '0'}]);
      machineToken.on('click', function(e) {
        // Need to explicitly fire the click handler as we are catching
        // the click event before it can be fired.
        view.handleMachineTokenSelect(e);
        assert.equal(view._containersHeader.get('label'), label);
        assert.equal(view._containersHeader.get(
            'container').one('.label').get('text'), label);
        done();
      });
      machineToken.simulate('click');
    });

    it('should select a token when clicked', function() {
      view.render();
      machines.add([
        {id: '0/lxc/1'}
      ]);
      // Click on a machine so that we have a list of containers.
      container.one('.machines li .token').simulate('click');
      // Now select a container.
      var containerToken = container.one('.containers li .token');
      containerToken.simulate('click');
      assert.equal(containerToken.hasClass('active'), true);
    });

    it('should annotate units with icons for its tokens', function() {
      var db = view.get('db'),
          unit = {id: 'foo/0', service: 'foo' };
      db.services.add({ id: 'foo', icon: 'http://example.com/foo.png' });
      unit = view._addIconsToUnits([unit])[0];
      assert.equal(unit.icon, 'http://example.com/foo.png');
    });

    it('should log an error when it cannot find the service', function() {
      var unit = {id: 'foo/0', service: 'foo' },
          errorStub = utils.makeStubMethod(console, 'error');
      this._cleanups.push(errorStub.reset);
      unit = view._addIconsToUnits([unit])[0];
      assert.equal(errorStub.calledOnce(), true);
      assert.equal(errorStub.lastArguments(), 'Unit foo/0 has no service.');
    });

    it('should update a machine when a new unit is placed', function() {
      view.render();
      var machineModel = machines.revive(0),
          unitModel = units.revive(0),
          id = machineModel.get('id'),
          selector = Y.Lang.sub('.machines .token[data-id="{id}"]', {id: id}),
          item = container.one(selector);
      assert.notEqual(item, null, 'machine was not initially displayed');
      assert.equal(item.one('img.unit'), null,
                   'machine should not have any unit icons initially');
      unitModel.set('machine', id);
      item = container.one(selector);
      assert.notEqual(item, null, 'machine was not displayed post-update');
      var icon = item.one('img.unit');
      assert.equal(icon.getAttribute('src'), 'test.svg',
                   'machine should display icons post-update');
    });

    it('should ignore added containers', function() {
      view.render();
      var selector = '.machines .token',
          list = container.all(selector),
          id = '2/foo/999',
          initialSize = list.size();
      assert.equal(initialSize, machines.size(),
                   'initial displayed list is out of sync with machines');
      machines.add([
        { id: id }
      ]);
      list = container.all(selector);
      assert.equal(list.size(), initialSize,
                   'list should not have changed in size');
      var addedItem = container.one(selector + '[data-id="' + id + '"]');
      assert.equal(addedItem, null, 'found container in displayed list');
    });

    it('should ignore removed containers', function() {
      var id = '2/foo/999';
      machines.add([{ id: id }]);
      view.render();
      var selector = '.machines .token',
          list = container.all(selector),
          initialSize = list.size(),
          m = machines.getById(id);
      assert.equal(initialSize, machines.size() - 1,
                   'initial displayed list is out of sync with machines');
      machines.remove(m);
      list = container.all(selector);
      assert.equal(list.size(), initialSize,
                   'list should not have changed in size');
      var deletedSelector = selector + '[data-id="' + id + '"]';
      var deletedItem = container.one(deletedSelector);
      assert.equal(deletedItem, null,
                   'found the deleted container in the list');
    });

    it('should ignore changed containers', function() {
      var id = '2/foo/999';
      machines.add([{ id: id }]);
      view.render();
      var selector = '.machines .token',
          list = container.all(selector),
          initialSize = list.size(),
          m = machines.getById(id);
      assert.equal(initialSize, machines.size() - 1,
                   'initial displayed list is out of sync with machines');
      m = machines.revive(m);
      m.set('hardware', {disk: 2048});
      list = container.all(selector);
      assert.equal(list.size(), initialSize,
                   'list should not have changed in size');
      var changedSelector = selector + '[data-id="' + id + '"]';
      var changedItem = container.one(changedSelector);
      assert.equal(changedItem, null,
                   'found the changed container still in the list');
    });

    it('should remove all tokens on destroy', function() {
      view.render();
      view.destroy();
      assert.equal(Object.keys(view.get('machineTokens')).length, 0,
                   'No machine tokens should exist');
      assert.equal(Y.all('.machines .token').size(), 0,
                   'No machine DOM elements should exist');
      assert.equal(Object.keys(view.get('unitTokens')).length, 0,
                   'No service unit tokens should exist');
      assert.equal(Y.all('.unplaced .unplaced-unit').size(), 0,
                   'No service unit DOM elements should exist');
    });
  });

  describe('container column', function() {
    it('creates container tokens without units', function() {
      var updateStub = utils.makeStubMethod(
          view, '_updateMachineWithUnitData');
      this._cleanups.push(updateStub.reset);
      var db = view.get('db'),
          filterStub = utils.makeStubMethod(db.units, 'filterByMachine');
      this._cleanups.push(filterStub.reset);
      var rendered = false,
          target;
      var viewStub = utils.makeStubMethod(views, 'ContainerToken', {
        render: function() { rendered = true; },
        addTarget: function(t) { target = t; }
      });
      this._cleanups.push(viewStub.reset);
      var containerParent = utils.makeContainer(this, 'machine-view-panel'),
          container = {};
      view._createContainerToken(containerParent, container);
      // Verify that units for the container were looked up since they weren't
      // provided
      assert.equal(filterStub.calledOnce(), true);
      assert.equal(updateStub.calledOnce(), true);
      assert.equal(viewStub.calledOnce(), true);
      // Verify token is rendered and has the view added as a target.
      assert.equal(rendered, true);
      assert.equal(target, view);
    });

    it('creates container tokens with units', function() {
      var updateStub = utils.makeStubMethod(view, '_updateMachineWithUnitData');
      this._cleanups.push(updateStub.reset);
      var db = view.get('db'),
          filterStub = utils.makeStubMethod(db.units, 'filterByMachine');
      this._cleanups.push(filterStub.reset);
      var rendered = false,
          target;
      var viewStub = utils.makeStubMethod(views, 'ContainerToken', {
        render: function() { rendered = true; },
        addTarget: function(t) { target = t; }
      });
      this._cleanups.push(viewStub.reset);
      var containerParent = utils.makeContainer(this, 'machine-view-panel'),
          units = [{}],
          container = {};
      view._createContainerToken(containerParent, container, units);
      // Verify that units for the container were provided, and not looked up.
      assert.equal(filterStub.calledOnce(), false);
      assert.equal(updateStub.calledOnce(), true);
      assert.equal(viewStub.calledOnce(), true);
      // Verify token is rendered and has the view added as a target.
      assert.equal(rendered, true);
      assert.equal(target, view);
    });

    it('creates container tokens when a machine is selected', function() {
      view.render();
      var target = container.one('.machines li .token');
      target.setData('id', '0');
      var mockEvent = {
        currentTarget: target,
        preventDefault: function() {}
      };
      machines.add([{ id: '0/lxc/0' }]);
      var renderStub = utils.makeStubMethod(view, '_renderContainerTokens');
      this._cleanups.push(renderStub.reset);
      view.handleMachineTokenSelect(mockEvent);
      assert.equal(renderStub.calledOnce(), true);
      var lastArgs = renderStub.lastArguments();
      assert.equal(lastArgs[0][0].displayName, '0/lxc/0');
      assert.equal(lastArgs[1], '0');
    });

    it('creates tokens for containers and "bare metal"', function() {
      view.render();
      machines.add([{ id: '0/lxc/0' }]);
      var containers = machines.filterByParent('0');
      var tokenStub = utils.makeStubMethod(view, '_createContainerToken');
      this._cleanups.push(tokenStub.reset);
      view._renderContainerTokens(containers, 0);
      assert.equal(tokenStub.callCount(), 2);
      var tokenArguments = tokenStub.allArguments();
      assert.equal(tokenArguments[0][1].displayName, '0/lxc/0');
      assert.equal(tokenArguments[1][1].displayName, 'Bare metal');
    });

    it('always creates a "bare metal" token', function() {
      view.render();
      var tokenStub = utils.makeStubMethod(view, '_createContainerToken');
      this._cleanups.push(tokenStub.reset);
      view._renderContainerTokens([], 0);
      assert.equal(tokenStub.callCount(), 1);
      var tokenArguments = tokenStub.allArguments();
      assert.equal(tokenArguments[0][1].displayName, 'Bare metal');
    });

    describe('functional tests', function() {
      it('can render containers on click of machine token', function() {
        view.render();
        machines.add([{ id: '0/lxc/0' }]);
        view.get('db').units.add([{id: 'test/2', machine: '0'}]);
        var token = container.one('.machine-token .token');
        assert.equal(
            token.hasClass('active'), false,
            'Machine token already selected.');
        token.simulate('click');
        assert.equal(
            token.hasClass('active'), true,
            'Machine token not marked as selected.');
        var containers = container.all('.container-token .token'),
            hardware = token.one('.details').get('text').replace(/\s+/g, '');
        // We should have one token for the new container and one for the
        // "bare metal".
        assert.equal(containers.size(), 2, 'Containers did not render.');
        assert.equal(hardware, '1x10.24GHz,1.0GB,1.0GB');
      });

      it('can select container tokens', function() {
        view.render();
        machines.add([{ id: '0/lxc/0' }]);
        view.get('db').units.add([{id: 'test/2', machine: '0'}]);
        var machineToken = container.one('.machine-token .token');
        machineToken.simulate('click');
        var containerToken = container.one('.container-token .token');
        assert.equal(
            containerToken.hasClass('active'), false,
            'Container token already selected.');
        containerToken.simulate('click');
        assert.equal(
            containerToken.hasClass('active'), true,
            'Container token not marked as selected.');
      });
    });
  });

  describe('mass scale up UI', function() {
    it('should render the scale up UI', function() {
      view.render();
      assert.equal(container.one(
          '.column.unplaced .scale-up .action-block span').get('text'),
          'Choose a service and add units');
    });

    it('should render the mass scale up UI', function() {
      var detachStub = utils.makeStubFunction();
      var onStub = utils.makeStubFunction({ detach: detachStub });
      var destroyStub = utils.makeStubFunction();
      scaleUpViewRender = utils.makeStubFunction({
        on: onStub,
        destroy: destroyStub
      });
      scaleUpView = utils.makeStubMethod(views, 'ServiceScaleUpView', {
        render: scaleUpViewRender
      });
      this._cleanups.push(scaleUpView.reset);
      view.render();
      assert.equal(scaleUpView.calledOnce(), true);
      assert.equal(scaleUpViewRender.calledOnce(), true);
      assert.equal(onStub.callCount(), 3);
      var onArgs = onStub.lastArguments();
      assert.equal(onArgs[0], 'listClosed');
    });

    it('properly destroys the scale up view up on destroy', function() {
      var detachStub = utils.makeStubFunction();
      var onStub = utils.makeStubFunction({ detach: detachStub });
      var destroyStub = utils.makeStubFunction();
      scaleUpViewRender = utils.makeStubFunction({
        on: onStub,
        destroy: destroyStub
      });
      scaleUpView = utils.makeStubMethod(views, 'ServiceScaleUpView', {
        render: scaleUpViewRender
      });
      this._cleanups.push(scaleUpView.reset);
      view.render();
      view.destroy();
      assert.equal(detachStub.callCount(), 3);
      assert.equal(destroyStub.callCount(), 1);
    });

    it('listens to addUnit event and calls env.add_unit', function(done) {
      view.render();
      view.set('env', {
        add_unit: utils.makeStubFunction()
      });
      var addUnitEvent = {
        serviceName: 'foo',
        unitCount: '10'
      };
      view._scaleUpView.after('addUnit', function() {
        var addUnit = view.get('env').add_unit;
        assert.equal(addUnit.callCount(), 1);
        var addUnitArgs = addUnit.lastArguments();
        assert.equal(addUnitArgs[0], addUnitEvent.serviceName);
        assert.equal(addUnitArgs[1], addUnitEvent.unitCount);
        done();
      });
      view._scaleUpView.fire('addUnit', addUnitEvent);
    });

    it('hides the "all placed" message when the service list is displayed',
        function() {
          var view = createViewNoUnits();
          view.render();
          // The message should be display initially.
          var message = view.get('container').one(
              '.column.unplaced .all-placed');
          assert.equal(message.getStyle('display'), 'block');
          // Click the button to open the panel and the message should
          // be hidden.
          container.one('.scale-up button.closed').simulate('click');
          message = view.get('container').one('.column.unplaced .all-placed');
          assert.equal(message.getStyle('display'), 'none');
        });

    it('shows the "all placed" message when the service list is closed',
        function() {
          var view = createViewNoUnits();
          view.render();
          // Click the button to open the panel and the message should
          // be hidden.
          container.one('.scale-up button.closed').simulate('click');
          var message = view.get('container').one(
              '.column.unplaced .all-placed');
          assert.equal(message.getStyle('display'), 'none');
          // Close the panel and the message should displayed again.
          container.one('.scale-up button.opened').simulate('click');
          message = view.get('container').one('.column.unplaced .all-placed');
          assert.equal(message.getStyle('display'), 'block');
        });
  });
});
