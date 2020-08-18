import {
  TransformerFactory,
  SourceFile,
  ClassDeclaration,
  Visitor,
  PropertyDeclaration,
  Identifier,
  ConstructorDeclaration,
  ModifiersArray,
  SyntaxKind,
  MethodDeclaration,
  Decorator,
  visitEachChild,
  visitNode,
  isClassDeclaration,
  AccessorDeclaration,
  createObjectLiteral,
  updateDecorator,
  createCall,
  createPropertyAssignment,
  createArrayLiteral,
  createStringLiteral,
  createTrue,
  createFalse,
  updateClassDeclaration,
  isCallExpression,
  isIdentifier,
  updateCall,
  isPropertyDeclaration,
  isConstructorDeclaration,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  Expression
} from 'typescript';

export function transform(): TransformerFactory<SourceFile> {

  const isReactiveDecorator =
    (decorator: Decorator): boolean => {
      const expression = decorator.expression;

      return (
        (isIdentifier(expression) && expression.escapedText === 'reactive') ||
        (isCallExpression(expression) && isIdentifier(expression.expression) && expression.expression.escapedText === 'reactive')
      );
    };

  const getReactiveDecorator =
    (node: ClassDeclaration): Decorator | undefined => {
      if (!node.decorators) {
        return undefined;
      }

      return node.decorators?.find(isReactiveDecorator);
    };

  const isReactive =
    (node: ClassDeclaration): boolean => !!getReactiveDecorator(node);

  const hasStaticModifier =
    (modifiers?: ModifiersArray): boolean => {
      return modifiers?.some(modifier => modifier.kind === SyntaxKind.StaticKeyword) ?? false;
    }

  const buildReflectionInfo =
    (node: ClassDeclaration) => {
      const properties = node.members
        .filter(member => isPropertyDeclaration(member))
        .map(member => {
          const property = member as PropertyDeclaration;

          return {
            name: (property.name as Identifier).escapedText.toString(),
            optional: !!property.questionToken,
            static: hasStaticModifier(property.modifiers),
            declaredInConstructor: false
          };
        });

      const constructor = node.members
        .find(x => isConstructorDeclaration(x)) as ConstructorDeclaration | undefined;

      if (constructor) {
        const membersInConstructor = constructor.parameters
          .filter(parameter => (parameter.modifiers?.length ?? 0) > 0)
          .map(parameter => {
            return {
              name: (parameter.name as Identifier).escapedText.toString(),
              optional: !!parameter.questionToken,
              static: hasStaticModifier(parameter.modifiers),
              declaredInConstructor: true
            };
          });

        properties.unshift(...membersInConstructor);
      }

      const getters = node.members
        .filter(member => isGetAccessorDeclaration(member))
        .map(member => {
          const getter = member as AccessorDeclaration;

          return {
            name: (getter.name as Identifier).escapedText.toString(),
            static: hasStaticModifier(getter.modifiers)
          };
        });

      const methods = node.members
        .filter(member => isMethodDeclaration(member))
        .map(member => {
          const method = member as MethodDeclaration;

          return {
            name: (method.name as Identifier).escapedText.toString(),
            static: hasStaticModifier(method.modifiers)
          };
        });

      return {
        properties,
        getters,
        methods
      };
    };

  return context => {
    return node => {
      const visitor: Visitor = classNode => {
        if (isClassDeclaration(classNode) && isReactive(classNode)) {
          const reflectionInfo = buildReflectionInfo(classNode);

          const decorators = classNode.decorators?.map(decorator => {
            if (!isReactiveDecorator(decorator)) {
              return decorator;
            }

            const reflectionInfoExpression = createObjectLiteral([
              createPropertyAssignment('properties', createArrayLiteral(
                reflectionInfo.properties.map(property => createObjectLiteral([
                  createPropertyAssignment('name', createStringLiteral(property.name)),
                  createPropertyAssignment('optional', property.optional ? createTrue() : createFalse()),
                  createPropertyAssignment('static', property.static ? createTrue() : createFalse()),
                  createPropertyAssignment('declaredInConstructor', property.declaredInConstructor ? createTrue() : createFalse()),
                ]))
              )),
              createPropertyAssignment('getters', createArrayLiteral(
                reflectionInfo.getters.map(getter => createObjectLiteral([
                  createPropertyAssignment('name', createStringLiteral(getter.name)),
                  createPropertyAssignment('static', getter.static ? createTrue() : createFalse())
                ]))
              )),
              createPropertyAssignment('methods', createArrayLiteral(
                reflectionInfo.methods.map(method => createObjectLiteral([
                  createPropertyAssignment('name', createStringLiteral(method.name)),
                  createPropertyAssignment('static', method.static ? createTrue() : createFalse())
                ]))
              ))
            ]);

            if (!isCallExpression(decorator.expression)) {
              return updateDecorator(decorator, createCall(
                decorator.expression,
                undefined,
                [reflectionInfoExpression]
              ));
            }

            const callExpression = decorator.expression;

            return updateDecorator(decorator, updateCall(
              callExpression,
              callExpression.expression,
              undefined,
              [reflectionInfoExpression, ...callExpression.arguments]
            ));
          })

          const newClassDeclaration = updateClassDeclaration(
            classNode,
            decorators,
            classNode.modifiers,
            classNode.name,
            classNode.typeParameters,
            classNode.heritageClauses,
            classNode.members
          );

          return newClassDeclaration;
        }

        return visitEachChild(classNode, visitor, context);
      };

      return visitNode(node, visitor);
    };
  };
}

export default transform;
