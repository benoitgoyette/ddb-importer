import DirectoryPicker from "./DirectoryPicker.js";
import { getPatreonTiers, setPatreonTier, BAD_DIRS } from "../muncher/utils.js";
import DDBMuncher from "../muncher/ddb.js";

// eslint-disable-next-line no-unused-vars
Hooks.on("renderDDBSetup", (app, html, user) => {
  DirectoryPicker.processHtml(html);
});

// eslint-disable-next-line no-unused-vars
Hooks.on("renderma", (app, html, user) => {
  DirectoryPicker.processHtml(html);
});

export class DDBSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings";
    options.template = "modules/ddb-importer/handlebars/settings.handlebars";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Settings";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
    const betaKey = game.settings.get("ddb-importer", "beta-key") != "";
    // const daeInstalled = utils.isModuleInstalledAndActive('dae') && utils.isModuleInstalledAndActive('Dynamic-Effects-SRD');
    const campaignIdCorrect = !game.settings.get("ddb-importer", "campaign-id").includes("join");
    const tier = game.settings.get("ddb-importer", "patreon-tier");
    const tiers = getPatreonTiers(tier);

    const uploadDir = game.settings.get("ddb-importer", "image-upload-directory");
    const dataDirSet = !BAD_DIRS.includes(uploadDir);

    const setupConfig = {
      "image-upload-directory": uploadDir,
      "cobalt-cookie": game.settings.get("ddb-importer", "cobalt-cookie"),
      "campaign-id": game.settings.get("ddb-importer", "campaign-id"),
      "beta-key": game.settings.get("ddb-importer", "beta-key"),
    };

    const setupComplete = dataDirSet && cobalt && campaignIdCorrect;

    return {
      cobalt: cobalt,
      beta: betaKey && cobalt,
      setupConfig: setupConfig,
      setupComplete: setupComplete,
      campaignIdCorrect: campaignIdCorrect,
      tiers: tiers,
    };
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    const imageDir = formData['image-upload-directory'];
    const campaignId = formData['campaign-id'];
    const cobaltCookie = formData['cobalt-cookie'];
    await game.settings.set("ddb-importer", "image-upload-directory", imageDir);
    await game.settings.set("ddb-importer", "cobalt-cookie", cobaltCookie);
    await game.settings.set("ddb-importer", "beta-key", formData['beta-key']);
    await game.settings.set("ddb-importer", "campaign-id", campaignId);

    const imageDirSet = !BAD_DIRS.includes(imageDir);
    const campaignIdCorrect = !campaignId.includes("join");
    await setPatreonTier();

    if (!imageDirSet) {
      $('#munching-task-setup').text(`Please set the image upload directory to something other than the root.`);
      $('#ddb-importer-settings').css("height", "auto");
      throw new Error(`Please set the image upload directory to something other than the root.`);
    } else if (cobaltCookie === "") {
      $('#munching-task-setup').text(`To use Muncher you need to set a Cobalt Cookie value!`);
      $('#ddb-importer-settings').css("height", "auto");
      throw new Error(`To use Muncher you need to set a Cobalt Cookie value!`);
    } else if (!campaignIdCorrect) {
      $('#munching-task-setup').text(`Incorrect CampaignID/URL! You have used the campaign join URL, please change`);
      $('#ddb-importer-settings').css("height", "auto");
      throw new Error(`Incorrect CampaignID/URL! You have used the campaign join URL, please change`);
    } else {
      const callMuncher = game.settings.get("ddb-importer", "settings-call-muncher");

      if (callMuncher) {
        game.settings.set("ddb-importer", "settings-call-muncher", false);
        new DDBMuncher().render(true);
      }
      // this.close();
    }
  }
}


function getCompendiumLookups(type, selected) {
  const selections = game.packs
  .filter((pack) => pack.entity === type)
  .reduce((choices, pack) => {
    choices[pack.collection] = {
      label: `[${pack.metadata.package}] ${pack.metadata.label}`,
      selected: pack.collection === selected,
    };
    return choices;
  }, {});

  return selections;
}


export class DDBCompendiumSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings-compendium";
    options.template = "modules/ddb-importer/handlebars/compendium.handlebars";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Compendium Settings";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const settings = [
      {
        name: "auto-create-compendium",
        isChecked: game.settings.get("ddb-importer", "auto-create-compendium"),
        description: "Create default compendiums if missing?",
        enabled: true,
      },
    ];

    const compendiums = [
      {
        setting: "entity-spell-compendium",
        name: "Spells",
        type: "item",
        current: game.settings.get("ddb-importer", "entity-spell-compendium"),
        compendiums: getCompendiumLookups("Item", game.settings.get("ddb-importer", "entity-spell-compendium")),
      },
      {
        setting: "entity-item-compendium",
        name: "Items",
        type: "item",
        current: game.settings.get("ddb-importer", "entity-item-compendium"),
        compendiums: getCompendiumLookups("Item", game.settings.get("ddb-importer", "entity-item-compendium")),
      },
      {
        setting: "entity-class-compendium",
        name: "Classes",
        type: "item",
        current: game.settings.get("ddb-importer", "entity-class-compendium"),
        compendiums: getCompendiumLookups("Item", game.settings.get("ddb-importer", "entity-class-compendium")),
      },
      {
        setting: "entity-feature-compendium",
        name: "Class features",
        type: "item",
        current: game.settings.get("ddb-importer", "entity-feature-compendium"),
        compendiums: getCompendiumLookups("Item", game.settings.get("ddb-importer", "entity-feature-compendium")),
      },
      {
        setting: "entity-race-compendium",
        name: "Races",
        type: "item",
        current: game.settings.get("ddb-importer", "entity-race-compendium"),
        compendiums: getCompendiumLookups("Item", game.settings.get("ddb-importer", "entity-race-compendium")),
      },
      {
        setting: "entity-trait-compendium",
        name: "Racial traits",
        type: "item",
        current: game.settings.get("ddb-importer", "entity-trait-compendium"),
        compendiums: getCompendiumLookups("Item", game.settings.get("ddb-importer", "entity-trait-compendium")),
      },
      {
        setting: "entity-monster-compendium",
        name: "Monsters",
        type: "actor",
        current: game.settings.get("ddb-importer", "entity-monster-compendium"),
        compendiums: getCompendiumLookups("Actor", game.settings.get("ddb-importer", "entity-monster-compendium")),
      },
    ];

    return {
      settings: settings,
      compendiums: compendiums,
    };
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    for (const [key, value] of Object.entries(formData)) {
      game.settings.set("ddb-importer", key, value);
    }
  }
}
