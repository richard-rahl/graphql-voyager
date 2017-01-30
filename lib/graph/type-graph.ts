import * as _ from 'lodash';
import { createSelector } from 'reselect'

import { store } from '../redux';

import {
  getSchemaSelector,
  isScalarType,
  isInputObjectType,
} from '../introspection/';

function getTypeGraph(schema, rootTypeId) {
  if (schema === null || rootTypeId === null)
    return null;

  return buildGraph(rootTypeId);

  function fieldEdges(type) {
    return _.map<any, any>(type.fields, field => ({
      connectionType: 'field',
      fromPort: field.name,
      to: field.type,
    }));
  }

  function unionEdges(type) {
    return _.map<string, any>(type.possibleTypes, possibleType => ({
      connectionType: 'possible_type',
    }));
  }

  function getEdgeTargets(type) {
    return _([
      ..._.values(type.fields),
      ...type.derivedTypes || [],
      ...type.possibleTypes || [],
    ])
      .map('type')
      .reject(isScalarType)
      .reject(isInputObjectType)
      .map('id')
      .value();
  }

  function buildGraph(rootId) {
    var typeIds = [rootId];
    var nodes = [];
    var types = _.keyBy(schema.types, 'id');

    for (var i = 0; i < typeIds.length; ++i) {
      var id = typeIds[i];
      if (typeIds.indexOf(id) < i)
        continue;

      var type = types[id];

      nodes.push(type);
      typeIds.push(...getEdgeTargets(type));
    }
    return {
      rootId,
      nodes: _.keyBy(nodes, 'id'),
    };
  }
}

export const getTypeGraphSelector = createSelector(
  getSchemaSelector,
  state => state.displayOptions.rootTypeId,
  getTypeGraph
);
