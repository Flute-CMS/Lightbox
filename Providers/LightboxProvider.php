<?php

namespace Flute\Modules\Lightbox\Providers;

use Flute\Core\Support\ModuleServiceProvider;

class LightboxProvider extends ModuleServiceProvider
{
    public array $extensions = [];

    public function boot(\DI\Container $container): void
    {
        if (is_admin_path()) {
            return;
        }

        $this->bootstrapModule();

        $this->loadScss('Resources/assets/scss/lightbox.scss');

        $jsFile = template()->getTemplateAssets()->assetFunction(path('app/Modules/Lightbox/Resources/assets/js/lightbox.js'));
        template()->prependToSection('footer', $jsFile);
    }

    public function register(\DI\Container $container): void
    {
    }
}
