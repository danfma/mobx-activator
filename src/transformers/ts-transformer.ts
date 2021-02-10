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
  factory,
  isCallExpression,
  isIdentifier,
  isPropertyDeclaration,
  isConstructorDeclaration,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isTypeNode,
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
            declaredInConstructor: false,
            readOnly: property.modifiers?.some(x => x.kind === SyntaxKind.ReadonlyKeyword)
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
              declaredInConstructor: true,
              readOnly: parameter.modifiers?.some(x => x.kind === SyntaxKind.ReadonlyKeyword)
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

          let reactiveDecorator: Decorator | undefined;
          let enhancementConfig: Expression | undefined;
          let userEnhancements: Expression[] = [];

          const decorators = classNode.decorators?.map(decorator => {
            if (!isReactiveDecorator(decorator)) {
              return decorator;
            }

            reactiveDecorator = decorator;

            enhancementConfig = factory.createArrayLiteralExpression([
              factory.createArrayLiteralExpression(
                reflectionInfo.properties
                  .filter(property => !property.static)
                  .map(property => factory.createArrayLiteralExpression([
                    factory.createStringLiteral(property.name),
                    property.readOnly ? factory.createTrue() : factory.createFalse()
                  ]))
              ),
              factory.createArrayLiteralExpression(
                reflectionInfo.getters
                  .filter(accessor => !accessor.static)
                  .map(getter => factory.createStringLiteral(getter.name))
              ),
              factory.createArrayLiteralExpression(
                reflectionInfo.methods
                  .filter(method => !method.static)
                  .map(method => factory.createStringLiteral(method.name))
              )
            ]);

            if (isCallExpression(decorator.expression)) {
              userEnhancements = decorator.expression.arguments.slice();
            }

            return null;
          });

          let classMembers = classNode.members.slice();
          let constructor = classNode.members.find(x => isConstructorDeclaration(x)) as ConstructorDeclaration | undefined;

          const reactiveEnhanceCallStatement = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                isCallExpression(reactiveDecorator?.expression!)
                  ? reactiveDecorator?.expression.expression!
                  : reactiveDecorator?.expression!,
                factory.createIdentifier('enhance')
              ),
              undefined,
              [
                classNode.name!,
                factory.createThis(),
                enhancementConfig ?? factory.createVoidZero(),
                ...userEnhancements
              ]
            )
          );

          if (!constructor) {
            constructor = factory.createConstructorDeclaration(
              undefined,
              undefined,
              [],
              factory.createBlock([
                reactiveEnhanceCallStatement
              ])
            );

            classMembers.unshift(constructor);
          } else {
            const newConstructor = factory.updateConstructorDeclaration(
              constructor,
              constructor.decorators,
              constructor.modifiers,
              constructor.parameters,
              constructor.body
                ? factory.updateBlock(constructor.body, [
                  ...constructor.body?.statements,
                  reactiveEnhanceCallStatement
                ])
                : factory.createBlock([
                  reactiveEnhanceCallStatement
                ])
            );

            classMembers = classMembers.map(member => isConstructorDeclaration(member) ? newConstructor : member);
          }

          let newDecorators: Decorator[] | undefined = decorators?.filter(x => x) as Decorator[];

          if (newDecorators.length === 0) {
            newDecorators = undefined;
          }

          const newClassDeclaration = factory.updateClassDeclaration(
            classNode,
            newDecorators,
            classNode.modifiers,
            classNode.name,
            classNode.typeParameters,
            classNode.heritageClauses,
            classMembers
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
