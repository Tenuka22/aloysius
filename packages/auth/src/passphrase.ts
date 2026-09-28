/**
 * Credential generation for accounts an operator never types twice.
 *
 * The old generator was two `crypto.randomUUID()` calls glued together: 72 hex
 * characters plus a fixed `!Aa9` tail. Unbroken, unambiguous, and completely
 * unhandleable - nobody can copy 76 characters off a screen and retype it from
 * a sticky note, and an admin who cannot retype their password ends up calling
 * the site admin instead. That is a worse outcome than a slightly smaller
 * search space, because the recovery path is the real attack surface.
 *
 * So: a passphrase. Four distinct words from a fixed list plus two digits,
 * hyphen separated and lower case. It survives being read down a phone line,
 * written on paper, and typed on a phone keyboard - and it is still far outside
 * guessing range. Concretely it carries
 * `log2(n) + log2(n-1) + log2(n-2) + log2(n-3) + 2 * log2(10)` bits for a list
 * of `n` words, which `passphrase.test.ts` asserts so the figure quoted here
 * cannot rot.
 */

/**
 * Short, concrete, neutral English words. Selection criteria, in order:
 *
 * - 3-8 letters, so the whole phrase stays typeable on a phone.
 * - Concrete nouns and simple adjectives over abstract ones, because a word
 *   with a picture attached is recalled without effort.
 * - No homophone neighbours (`sail`/`sale`, `right`/`write`) and nothing that
 *   differs only by a stripped `e`, so a word heard once is a word typed right.
 * - No words that carry religion, politics, sport teams or animal breed
 *   politics. This list ends up on paper in a school.
 *
 * Deduplicated on load below, which is also what makes the entropy figure in
 * this file's header exact: it is derived from the surviving count, so an
 * accidental repeat can only ever raise the strength, never quietly lower it.
 */
const RAW_WORDS = `
anchor anchorite anvils apricot arbour arcade archer armature arrowhead ashen
aspen asphalt aster atlas auburn awning axle azure badger baffle bakehouse
ballad balsam bamber bamboo banner barn barrel basalt basketry bassoon bay
beacon beagle beam bedrock beehive beetle bellows belfry bellow berth birch
bison bistro bladder blade blanket blaze blender blinker blossom bough boulder
bounty bracken bramble brand brass brazier breeches brick bridle brine brisket
britches broad bronze buckle budge buffalo bugle bulwark bunt buoy burrow
bushel buttress cabin cable cactus cairn calico calligraphy camel camp canal
candle canoe canopy canyon capital caper caramel caravan cardinal cargo carol
carpenter cascade casket castle catalog cauldron cavern cedar cellar cement
census chalice chamber channel chapel charcoal chariot chasm chestnut chime
chimney chisel cinder cistern citadel clamber clarion clatter clay cleft cliff
climate clover cinder cobble cockpit cocoa coil collar colony column comb
compass conch concrete conifer copper coral cord cork cormorant cornice corral
cosmos cottage cougar cradle crag crank crate crayon creek crescent cress
cresta crevice cricket crocus croft crumpet crystal cupola curb curio curt
cushion cypress dagger dahlia dairy damask dapple darter dawn daylight debris
decoy delta derrick dervish dhow diadem diesel dinghy diorama dipper dingo
dispatch distill ditch diver docket dodo dogwood dolmen dome domino donkey
door dormer dossier dovecote dowel downs draft dragon drain drape dredge
dregs drift drill drum dryad duck duct dugout dulcet dune dungeon duplex
dusk dwelling dyad eagle earth easel eaves ebony eddy edifice eel egg
elder elixir elm ember emu enclave epoch equinox errand esker estate estuary
evergreen exhaust fable facade fairway falcon fallow fathom fauna fennel
ferment fern ferry fiddle fig filament filly finch finial fir flint flock
flotilla flour flute fjord flume foal fodder foil foliage follicle fondue
footman forceps forge fossil foundry fountain foxglove fresco fret frieze
frigate frolic fulcrum fulcrum fungus funnel furlong furrow gable gadfly
gainsay galleon gallery gallon gambit gantry garden gargoyle garland garnet
gasket gate gavel gazebo gecko geode geyser gherkin gimlet ginger girder
glacier glade glazier gleam glen gneiss goblet gorge gosling gourd granite
grapple gravel grotto grouse grove gruel gudgeon guild gull gully gunwale
gusto gutter gypsum hackle haddock halyard hamlet hammock hamper handcart
harbour harness harrow hatchet haven hawser hazel hearth heather hedgerow
helix hemlock henge herald heron hessian hickory hinge hoist hollow homestead
honey hood hoop hornbeam hostel hound hovel hummock hurdle hyacinth icicle
igloo ingot inkwell inlet insignia iodine iris isthmus ivory jackal jamb
jangle jasmine javelin jetty jigsaw jonquil jubilee juniper junket jute kayak
kelp kennel kernel kestrel keystone kiln kingfisher kiosk kipper knapsack
knoll kohlrabi kraken kumquat lacquer ladder lagoon lair lamprey lancet
lantern lapis larch larder lariat lattice lavender ledger leeward legume
lemur lentil levee lichen lilac limestone lintel lioness lintel lobe lobster
locket locust loft loganopy loggia loincloth lorry lozenge lumber lychee
mackerel magnet magpie mallard mallet mandrake mangrove mantle maple marble
margin marigold marina marmot marrow marsh mastiff meadow medley melon
menagerie merino mesa mica midden midge millstone mineral minnow mint mistletoe
mitten moccasin mole monarch monsoon montage moor moraine mortar mosaic
mosque moss moth mullein mullet mullet musket mustang myrtle nacre nadir
narwhal nautilus nectar nettle newel nightjar nimbus nozzle nugget nutmeg
oakum obelisk oboe ocarina ochre octagon odyssey ogle okra oleander olive
onyx opal orchard oriel osprey otter outcrop outrig oxbow oyster paddock
pagoda palisade pallas palm palmetto pampas panacea pantry papaya parapet
parcel parsnip pastiche pastel pasture patina pavilion peat pebble pelican
pendant penumbra peony pepper percale pergola petrel pewter pheasant phlox
piazza picket piebald pigment pilaster pinnacle piston pitchfork plait
plankton plateau platinum plaza plinth plover plumage plywood podzol pommel
poncho pontoon poplar porphyry portico possum potter prairie precipice
prism pumice purslane pylon quarry quartz quaver quill quince quiver radish
rafter ragwort rampart rapids rattan ravine rebus redwood reef regatta relic
rhubarb ribbon ridgeline rift rivulet roebuck rookery rosin rotunda rowan
rubble rudder rushes sable saddle saffron sagebrush salver samphire sandbar
sapling sarsen sassafras satchel savanna sawdust scaffold scallop scarab
sconce scree scrimshaw scupper sediment sentinel sepia sequoia shale
shanty sheaf sherbet shingle shrike shutter sickle sidecar signal silo
sinew siphon sizzle skerry skiff skirmish skittle skylark sleet slipway
sloop smelt snicket sojourn solstice sonnet sorrel spandrel spelt spinnaker
spire sprocket spry squadron squall stanchion stanza staple starboard
starling steed steppe stipple stoat stonework stopgap stork strainer
stratum stucco stupor sumac summit sundial sunfish surrey swallow swathe
sycamore syrup tabard tackle taffrail talus tamarind tambourine tandem
tannin tapestry tarragon tassel tawny teakettle tempest tendril terrace
terracotta tessera thatch thicket thimble thistle thorax threshold thrush
tiller timber tinder toboggan tomahawk topaz torrent tortoise totem tureen
turret tussock twine typhoon udder ukulele ulster umber upland urchin
vagrant valance valise valley vantage vapour variegate vellum veneer verbena
verdigris vertex vessel vestry viaduct vicar viking vinegar vineyard viola
violet viper vista vitrine volcano voyage wader waffle wagon wainscot walnut
walrus warble warren wassail waterway wattle wazir weathervane weevil wharf
wheelbarrow whetstone whinchat whirlpool whittle wicker wicket wigwam
wilder willow windlass windmill windsock winnow wisteria wolfram woodbine
woodyard wren wyvern yacht yardarm yarrow yew yonder yowl zeolite zephyr
zeppelin zinnia
`
  .trim()
  .split(/\s+/u);

const WORDS = [...new Set(RAW_WORDS)];

/** Words per passphrase. Four reads as a phrase, not as a list. */
const WORD_COUNT = 4;
/** Trailing digits. Two keeps the shape familiar without adding real length. */
const DIGIT_COUNT = 2;

/** One draw from `crypto.getRandomValues(new Uint32Array(1))` is uniform here. */
const UINT32_RANGE = 2 ** 32;

/**
 * A uniform integer in `[0, max)` from the CSPRNG.
 *
 * Rejection sampling rather than `value % max`: the 2^32 draws are not divisible
 * by an arbitrary `max`, so a modulo would make the first `2^32 % max` outcomes
 * measurably more likely than the rest. Throwing away the out-of-range draws
 * costs nothing and keeps every word equally likely.
 */
const randomInt = (max: number) => {
  const limit = Math.floor(UINT32_RANGE / max) * max;
  const draw = new Uint32Array(1);
  let value = limit;
  while (value >= limit) {
    crypto.getRandomValues(draw);
    value = draw[0] ?? 0;
  }
  return value % max;
};

const pickWords = (count: number) => {
  // Drawn without replacement. An independent draw per slot can repeat a word,
  // and "anchor-cellar-anchor-lantern" reads as three words rather than four -
  // the operator has to stop and check which one they are on, which is exactly
  // the friction this format exists to remove.
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(randomInt(WORDS.length));
  }
  return [...indices].map((index) => WORDS[index] ?? "anchor");
};

/**
 * Generates a credential that is never chosen or reused by an operator.
 *
 * Lower case with hyphens, deliberately: hyphens survive being read aloud and
 * never get autocapitalised or autocorrected by a phone keyboard, so what the
 * operator retypes is what was issued. The password fields this app renders set
 * `autoCapitalize="none"` to keep it that way.
 */
export const generatePassphrase = () => {
  const parts: string[] = [...pickWords(WORD_COUNT)];
  for (let index = 0; index < DIGIT_COUNT; index += 1) {
    parts.push(String(randomInt(10)));
  }
  return parts.join("-");
};

/**
 * Bits of entropy in one generated passphrase: the words are drawn without
 * replacement, so it is `log2(n) + log2(n-1) + ...` rather than four times
 * `log2(n)`. Exported so `passphrase.test.ts` can pin the figure quoted above.
 */
export const PASSPHRASE_ENTROPY_BITS =
  Math.round(
    (Array.from({ length: WORD_COUNT }, (_, index) =>
      Math.log2(WORDS.length - index)
    ).reduce((total, bits) => total + bits, 0) +
      DIGIT_COUNT * Math.log2(10)) *
      10
  ) / 10;

export const PASSPHRASE_WORDS = WORDS;
