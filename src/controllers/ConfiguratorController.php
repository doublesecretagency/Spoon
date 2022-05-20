<?php
/**
 * Spoon plugin for Craft CMS 3.x
 *
 * Enhance Matrix
 *
 * @link      https://plugins.doublesecretagency.com/
 * @copyright Copyright (c) 2018, 2022 Double Secret Agency
 */

namespace doublesecretagency\spoon\controllers;

use doublesecretagency\spoon\Spoon;

use Craft;
use craft\fieldlayoutelements\CustomField;
use craft\web\Controller;

/**
 * Configurator Controller
 *
 * @package   Spoon
 * @since     3.0.0
 */
class ConfiguratorController extends Controller
{

    // Protected Properties
    // =========================================================================

    /**
     * @var    bool|array Allows anonymous access to this controller's actions.
     *         The actions must be in 'kebab-case'
     * @access protected
     */
    protected $allowAnonymous = false;

    // Public Methods
    // =========================================================================

    /**
     * Returns the fld HTML for the main configurator
     *
     * @return \yii\web\Response
     * @throws \Twig_Error_Loader
     * @throws \yii\base\Exception
     * @throws \yii\web\BadRequestHttpException
     */
    public function actionGetHtml()
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $fieldId = Craft::$app->getRequest()->getParam('fieldId');
        $field = Craft::$app->fields->getFieldById($fieldId);
        $blockTypes = Craft::$app->matrix->getBlockTypesByFieldId($fieldId);

        $blockTypeIds = [];
        foreach ($blockTypes as $blockType)
        {
            $blockTypeIds[] = $blockType->id;
        }

        $context = Craft::$app->getRequest()->getParam('context');

        $spoonedBlockTypes = Spoon::$plugin->blockTypes->getByContext($context, 'groupName', false, $fieldId);

        $fld = Craft::$app->view->renderTemplate('spoon/flds/configurator', array(
            'matrixField' => $field,
            'blockTypes' => $blockTypes,
            'blockTypeIds' => $blockTypeIds,
            'spoonedBlockTypes' => $spoonedBlockTypes
        ));

        return $this->asJson([
            'html' => $fld
        ]);
    }

    /**
     * Returns the html for the individual block type fld.
     *
     * @return \yii\web\Response
     * @throws \Twig_Error_Loader
     * @throws \yii\base\Exception
     * @throws \yii\web\BadRequestHttpException
     */
    public function actionGetFieldsHtml()
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $context = Craft::$app->getRequest()->getParam('context');
        $blockTypeId = Craft::$app->getRequest()->getParam('blockTypeId');

        $spoonedBlockType = Spoon::$plugin->blockTypes->getBlockType($context, $blockTypeId);

        $fieldLayout = $spoonedBlockType->getFieldLayout();

        $blockTypeFldFields = [];
        foreach ($spoonedBlockType->matrixBlockType->getFields() as $field) {
            $blockTypeFldFields[] = Craft::createObject(CustomField::class, [$field]);
        }

        $fld = Craft::$app->view->renderTemplate('spoon/flds/fields', array(
            'spoonedBlockType' => $spoonedBlockType,
            'fieldLayout' => $fieldLayout,
            'blockTypeFields' => $blockTypeFldFields,
//            'customizableUi' => true
        ));

        return $this->asJson([
            'html' => $fld
        ]);
    }

}
