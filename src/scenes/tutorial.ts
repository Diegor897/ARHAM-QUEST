import { THREE } from '@enable3d/phaser-extension'

import BaseScene3D from './base'
import Actor from '../actor/actor'
import Trigger from '../actor/trigger'
import Scarecrow from '../actor/scarecrow'
import Water from '../actor/water'
import GrassPatch from '../actor/grass'
import * as Types from '@enable3d/common/dist/types'

import { DialogueBuilder } from '../system/dialogues'
import Character from '../actor/character'
import InvisibleWall from '../actor/wall'

/**
 * Escena simple.
 */
export class TutorialScene extends BaseScene3D {

  private scarecrows : Scarecrow[] = []

  constructor() {
    super({ key: 'TutorialScene' })
    this.spawnpoint.set(0, 6.5, 15)
  }

  init0() {
  }

  preload0() {
    this.load.gltf("level", "assets/level/tutorial.glb")
  }

  create0() {
    this.dialogueSystem?.registerDialogue(
      new DialogueBuilder("movimiento_wasd")
        .addLine("Arham", "¡Vamos a empezar con lo más sencillo! Usa las teclas WASD para moverte.")
        .build())
    this.dialogueSystem?.registerDialogue(
      new DialogueBuilder("movimiento_shift")
        .addLine("Arham", "¡Muy bien! Ahora, prueba a correr utilizando la tecla SHIFT.")
        .build())
    this.dialogueSystem?.registerDialogue(
      new DialogueBuilder("ataque")
        .addLine("Arham", "¡Genial! Ahora, sube por la colina. Para librar el camino, deshazte de los espantapájaros golpeándoles con RATÓN IZQ.")
        .build())
    this.dialogueSystem?.registerDialogue(
      new DialogueBuilder("salto")
        .addLine("Arham", "Para poder saltar el estrecho, salta utilizando la tecla ESPACIO.")
        .build())
    this.dialogueSystem?.registerDialogue(
      new DialogueBuilder("doble_salto")
        .addLine("Arham", "Este salto es muy complicado. Utiliza la tecla ESPACIO dos veces para utilizar la habilidad Doble Salto.")
        .build())
    this.dialogueSystem?.registerDialogue(
      new DialogueBuilder("fin")
        .addLine("Arham", "¡Bien hecho, aprendiz! Ahora, vuelve al poblado por el portal.")
        .build())
    this.dialogueSystem?.registerDialogue(
      new DialogueBuilder("grito")
        .addLine("Arham", "¡Aaaaahhhhhhh!")
        .addLine("Elron", "¿Qué habrá sido eso...?")
        .build())

    this.player.canAttack = false
    this.frozen = true

    //this.third.physics.debug?.enable()

    this.addGrass()
    this.addWater()
    this.spawnScarecrows()
    this.startPlayerWalk()

    this.addInvisibleWall(-1.15, 9, -17, { shape: 'box', width: 3.5, height: 1, depth: 4}, 0)
    this.addInvisibleWall(18.4, 6, -8, { shape: 'box', width: 5, height: 40, depth: 100}, 0)
    this.addInvisibleWall(-11, 6, 34.4, { shape: 'box', width: 5, height: 8, depth: 5}, 1.15)  
    this.addInvisibleWall(13, 6, 35, { shape: 'box', width: 1, height: 8, depth: 10}, 2.5) 
    this.addInvisibleWall(10, 6, 37, { shape: 'box', width: 1, height: 8, depth: 10}, 2) 
    this.addInvisibleWall(5, 6, 38.5, { shape: 'box', width: 1, height: 8, depth: 5}, 1.6)
    this.addInvisibleWall(-16, 13, -41, { shape: 'box', width: 1, height: 8, depth: 20}, 0)  
    this.addInvisibleWall(-2, 13, -49, { shape: 'box', width: 30, height: 8, depth: 1}, 0) 
    this.addInvisibleWall(6, 13, -46, { shape: 'box', width: 16, height: 13, depth: 1}, -1.2)
    this.addInvisibleWall(15, 6, -16, { shape: 'box', width: 5, height: 40, depth: 30}, 0.1)

    this.third.scene.children.forEach(child => {
      if (child.name == "level") {
        let mesh = child.getObjectByName("Plane") as THREE.Mesh
        mesh.material = new THREE.MeshStandardMaterial({ color: 0x557837, side: THREE.BackSide })
      }
    })
  }

  grassPatch(radius: number, density: number) : void {
    let position = this.player?.position || new THREE.Vector3(0, 0, 0)
    this.addGrassPatch(position.x, position.y, position.z, radius, density)
  }

  addGrassPatch(x: number, y: number, z: number, radius: number, density: number) : void {
    let grass = new GrassPatch(this, x, y, z, radius, density)
  }

  addWater() : void {
    let water = new Water(this, 35, 3.25)
    water.teleport(-2.8, 5.35, -31.5)
  }

  addInvisibleWall(x : integer, y: integer, z: integer, physicsBodyOptions: Types.AddExistingConfig, rotation: number) : void {
    let wall = new InvisibleWall(this, physicsBodyOptions)
    wall.teleport(x, y, z)
    wall.rotate(0, rotation, 0);
    window.wall = wall
  }

  spawnScarecrows() : void {
    let locations = [
      new THREE.Vector3(9.600748062133789, 6.524651718139649, -0.586362361907959),
      new THREE.Vector3(10.920928955078125, 6.5222804069519045, 1.809347510337829),
      new THREE.Vector3(13.6235990524292, 6.569859218597412, 1.142570137977),
      new THREE.Vector3(9.197203636169434, 6.520548534393311, -3.072697162628174)
    ]
    for (let loc of locations) {
      let scarecrow = new Scarecrow(this)
      scarecrow.teleport(loc.x, loc.y, loc.z)
      this.scarecrows.push(scarecrow)
    }
  }

  startPlayerWalk() : void {
    let trigger = new Trigger(this, { shape: "box", x: 0, y: 0, z: 0, width: 2, height: 2, depth: 2 })
    this.third.add.existing(trigger)
    trigger.teleport(this.spawnpoint.x, this.spawnpoint.y + 0.5, this.spawnpoint.z)
    this.registerPlayerWalkListener(trigger)

    this.time.delayedCall(1000, () => {
      this.dialogueSystem?.playDialogue("movimiento_wasd")
    })
  }

  registerPlayerWalkListener(trigger: Trigger) : void {
    this.events.once("trigger_exit", (t: Trigger, actor: Actor) => {
      if (trigger == t && actor == this.player) {
        trigger.destroy()
        this.time.delayedCall(2000, () => {
          this.startPlayerRun()
        })
      } else {
        this.registerPlayerWalkListener(trigger)
      }
    })
  }

  startPlayerRun() : void {
    this.dialogueSystem?.playDialogue("movimiento_shift")
    this.events.once("run", (actor: Actor) => {
      if (actor == this.player) {
        this.time.delayedCall(2000, () => {
          this.startPlayerAttack()
        })
      }
    })
  }

  startPlayerAttack() : void {
    if (!this.player) {
      return
    }
    this.player.canAttack = true
    this.dialogueSystem?.playDialogue("ataque")
    this.registerPlayerAttackListener()
  }

  registerPlayerAttackListener() : void {
    this.events.once("die", (character: Character) => {
      if (this.scarecrows.includes(character)) {
        this.startPlayerJump()
      } else {
        this.registerPlayerAttackListener()
      }
    })
  }

  startPlayerJump() : void {
    let trigger = new Trigger(this, { shape: "box", x: 0, y: 0, z: 0, width: 2, height: 2, depth: 2 })
    this.third.add.existing(trigger)
    trigger.teleport(12, 8, -4.5)
    this.registerPlayerJumpListener(trigger)
  }

  registerPlayerJumpListener(trigger: Trigger) : void {
    this.events.once("trigger_enter", (t: Trigger, actor: Actor) => {
      if (trigger == t && actor == this.player) {
        trigger.destroy()
        this.dialogueSystem?.playDialogue("salto")
        this.startPlayerDoubleJump()
      } else {
        this.registerPlayerJumpListener(trigger)
      }
    })
  }

  startPlayerDoubleJump() : void {
    let trigger = new Trigger(this, { shape: "box", x: 0, y: 0, z: 0, width: 6, height: 2, depth: 2 })
    this.third.add.existing(trigger)
    trigger.teleport(8.0, 12.5, -28.0)
    trigger.rotate(0, 20 * Math.PI / 360, 0)
    this.registerPlayerDoubleJumpListener(trigger)
  }

  registerPlayerDoubleJumpListener(trigger: Trigger) : void {
    this.events.once("trigger_enter", (t: Trigger, actor: Actor) => {
      if (trigger == t && actor == this.player) {
        trigger.destroy()
        this.dialogueSystem?.playDialogue("doble_salto")
        this.startPlayerCompleteTutorial()
      } else {
        this.registerPlayerDoubleJumpListener(trigger)
      }
    })
  }

  startPlayerCompleteTutorial() : void {
    let trigger = new Trigger(this, { shape: "box", x: 0, y: 0, z: 0, width: 10, height: 10, depth: 14 })
    this.third.add.existing(trigger)
    trigger.teleport(2.5, 13.0, -41.5)
    this.registerPlayerCompleteTutorialListener(trigger)
  }

  registerPlayerCompleteTutorialListener(trigger: Trigger) : void {
    this.events.once("trigger_enter", (t: Trigger, actor: Actor) => {
      if (trigger == t && actor == this.player) {
        trigger.destroy()
        this.time.delayedCall(1000, () => {
          this.dialogueSystem?.playDialogue("fin")
          this.startArhamScream()
        })
      } else {
        this.registerPlayerCompleteTutorialListener(trigger)
      }
    })
  }

  startArhamScream() : void {
    let trigger = new Trigger(this, { shape: "box", x: 0, y: 0, z: 0, width: 5, height: 2, depth: 15 })
    this.third.add.existing(trigger)
    trigger.teleport(-6.2, 13, -41)
    this.registerArhamScreamListener(trigger)
  }

  registerArhamScreamListener(trigger: Trigger) : void {
    this.events.once("trigger_enter", (t: Trigger, actor: Actor) => {
      if (trigger == t && actor == this.player) {
        trigger.destroy()
        this.dialogueSystem?.playDialogue("grito")
      } else {
        this.registerArhamScreamListener(trigger)
      }
    })
  }

  addGrass() : void {
    /* Forgive me Father, for I have sinned */
    
    this.addGrassPatch(0.0, 5.5, 15.0, 4, 1)
    this.addGrassPatch(7.35552978515625, 5.5, 12.694753646850586, 4, 1)
    this.addGrassPatch(5.751502990722656, 5.5, 20.36534309387207, 4, 1)
    this.addGrassPatch(13.323440551757812, 5.5, 18.100872039794922, 4, 1)
    this.addGrassPatch(1.3578206300735474, 5.5, 7.576245307922363, 4, 1)
    this.addGrassPatch(11.317376136779785, 5.5, 25.663061141967773, 4, 1)
    this.addGrassPatch(3.9799563884735107, 5.5, 28.10205078125, 4, 1)
    this.addGrassPatch(-1.1628707647323608, 5.5, 22.23232078552246, 4, 1)
    this.addGrassPatch(-7.263363838195801, 5.5, 16.914493560791016, 4, 1)
    this.addGrassPatch(-5.85499906539917, 5.5, 9.540892601013184, 4, 1)
    this.addGrassPatch(8.437858581542969, 5.5, 5.2995991706848145, 4, 1)
    this.addGrassPatch(14.981047630310059, 5.5, 10.286043167114258, 4, 1)
    this.addGrassPatch(14.194944381713867, 5.5, 1.0463365316390991, 2, 1)
    this.addGrassPatch(9.566096305847168, 5.5, -0.1085137203335762, 2, 1)
    this.addGrassPatch(13.210325241088867, 5.5, 3.767119884490967, 2, 1)
    this.addGrassPatch(11.384015083312988, 5.5, 1.4963502883911133, 2, 1)
    this.addGrassPatch(8.56663990020752, 5.5, -5.9974541664123535, 5, 1)
    this.addGrassPatch(11.95073127746582, 5.5, 13.471543312072754, 2, 1)
    this.addGrassPatch(9.169028282165527, 5.5, 17.02179718017578, 2, 1)
    this.addGrassPatch(10.006206512451172, 5.5, 21.453033447265625, 2, 1)
    this.addGrassPatch(6.948263645172119, 5.5, 24.641605377197266, 2, 1)
    this.addGrassPatch(3.1729884147644043, 5.5, 23.822744369506836, 2, 1)
    this.addGrassPatch(1.6368142366409302, 5.5, 18.776147842407227, 1, 1)
    this.addGrassPatch(4.441494941711426, 5.5, 16.262832641601562, 1, 1)
    this.addGrassPatch(-3.166248083114624, 5.5, 18.306419372558594, 1, 1)
    this.addGrassPatch(10.5202054977417, 5.5, 9.449461936950684, 1, 1)
    this.addGrassPatch(12.965084075927734, 5.5, 6.409276008605957, 1, 1)
    this.addGrassPatch(11.422067642211914, 5.5, 7.820450305938721, 1, 1)
    this.addGrassPatch(5.6484856605529785, 5.5, 8.659011840820312, 1, 1)
    this.addGrassPatch(2.76949405670166, 5.5, 11.76746654510498, 2, 1)
    this.addGrassPatch(-1.5079917907714844, 5.5, 10.849038124084473, 1.5, 1)
    this.addGrassPatch(-4.314025402069092, 5.5, 13.596891403198242, 1.5, 1)
    this.addGrassPatch(15.251561164855957, 5.5, 14.261748313903809, 1, 1)
    this.addGrassPatch(-5.469122409820557, 5.5, 26.337717056274414, 4, 1)
    this.addGrassPatch(-12.011083602905273, 5.5, 24.093236923217773, 4, 1)
    this.addGrassPatch(-13.005792617797852, 5.5, 18.25946617126465, 4, 1)
    this.addGrassPatch(-9.493258476257324, 5.5, 31.004152297973633, 3, 1)
    this.addGrassPatch(9.680618286132812, 5.5, 30.171052932739258, 3, 1)
    this.addGrassPatch(11.469823837280273, 5.5, 33.54262924194336, 3, 1)
    this.addGrassPatch(6.273494720458984, 5.5, 32.2137336730957, 2, 1)
    this.addGrassPatch(9.06265640258789, 5.5, 36.137935638427734, 2, 1)
    this.addGrassPatch(8.546296119689941, 5.5, 33.14720916748047, 1, 1)
    this.addGrassPatch(8.308188438415527, 5.5, 34.20432662963867, 1, 1)
    this.addGrassPatch(6.253778457641602, 5.5, 37.46137619018555, 1, 1)
    this.addGrassPatch(6.62546968460083, 5.5, 37.01054763793945, 1, 1)
    this.addGrassPatch(4.323358535766602, 5.5, 36.2449951171875, 2, 1)
    this.addGrassPatch(3.035086154937744, 5.5, 33.06734085083008, 3, 1)
    this.addGrassPatch(-5.743808269500732, 5.5, 32.2946891784668, 3, 1)
    this.addGrassPatch(-0.9441492557525635, 5.5, 28.486513137817383, 4, 1)
    this.addGrassPatch(0.4875001013278961, 5.5, 34.79508590698242, 2, 1)
    this.addGrassPatch(-0.9223000407218933, 5.5, 31.54585075378418, 2, 1)
    this.addGrassPatch(-2.189329147338867, 5.5, 31.6629695892334, 2, 1)
    this.addGrassPatch(-11.36408519744873, 5.5, 11.883387565612793, 4, 1)
    this.addGrassPatch(-12.088370323181152, 5.5, 5.346055507659912, 4, 1)
    this.addGrassPatch(-3.0816843509674072, 5.5, 5.448870658874512, 4, 1)
    this.addGrassPatch(1.6629526615142822, 5.5, 0.8062358498573303, 4, 1)
    this.addGrassPatch(5.723112106323242, 5.5, 0.300231397151947, 4, 1)
    this.addGrassPatch(4.321770668029785, 5.5, 4.3846635818481445, 0.5, 1)
    this.addGrassPatch(-3.818108558654785, 5.5, -2.112776279449463, 4, 1)
    this.addGrassPatch(-7.572266578674316, 5.5, 4.745150089263916, 2, 1)
    this.addGrassPatch(-5.644363880157471, 5.5, 2.0688157081604004, 2, 1)
    this.addGrassPatch(-8.40929126739502, 5.5, -1.572714924812317, 2, 1)
    this.addGrassPatch(-6.8279290199279785, 5.5, 0.4644288122653961, 1, 1)
    this.addGrassPatch(-11.226064682006836, 5.5, 0.23103854060173035, 2, 1)
    this.addGrassPatch(-13.302987098693848, 5.5, -3.85180401802063, 3, 1)
    this.addGrassPatch(-9.723353385925293, 5.5, -3.967541217803955, 1, 1)
    this.addGrassPatch(-7.62458610534668, 5.5, -5.591116905212402, 2, 1)
    this.addGrassPatch(1.0996601581573486, 5.5, -5.062351703643799, 4, 1)
    this.addGrassPatch(-3.952420711517334, 5.5, -8.372320175170898, 4, 1)
    this.addGrassPatch(2.8475465774536133, 5.5, -11.821187019348145, 4, 1)
    this.addGrassPatch(8.337005615234375, 5.38942367553711, -14.598414421081543, 4, 1)
    this.addGrassPatch(5.648561477661133, 5.394882984161377, -19.221879959106445, 4, 1)
    this.addGrassPatch(2.6478335857391357, 5.4235466194152835, -16.17915916442871, 1, 1)
    this.addGrassPatch(0.9365992546081543, 5.415758438110352, -23.22859001159668, 4, 1)
    this.addGrassPatch(-6.0266218185424805, 5.465433902740479, -22.562986373901367, 4, 1)
    this.addGrassPatch(-6.348951816558838, 5.4609072875976565, -16.5618896484375, 3, 1)
    this.addGrassPatch(-3.805116653442383, 5.477718181610108, -12.61512279510498, 4, 1)
    this.addGrassPatch(-2.2358524799346924, 5.4451530647277835, -20.29442024230957, 1, 1)
    this.addGrassPatch(6.488371849060059, 5.372492141723633, -25.302587509155273, 3, 1)
    this.addGrassPatch(-10.38168716430664, 5.415137596130371, -24.87726402282715, 3, 1)
    this.addGrassPatch(-2.795358896255493, 5.429810829162598, -27.297119140625, 2, 0.5)
    this.addGrassPatch(-0.2907821834087372, 5.412339992523194, -27.46656036376953, 2, 0.25)
    this.addGrassPatch(3.441126823425293, 5.386568374633789, -27.665260314941406, 2, 0.25)
    this.addGrassPatch(-6.316944122314453, 5.453488178253174, -27.6162052154541, 2, 0.25)
    this.addGrassPatch(-8.841842651367188, 5.469443149566651, -28.059818267822266, 2, 0.25)
    this.addGrassPatch(-11.951173782348633, 5.3955996704101565, -27.909725189208984, 2, 0.25)
    this.addGrassPatch(20.164226531982422, 5.514474697113037, 2.809770107269287, 5, 1)
    this.addGrassPatch(25.27750015258789, 5.514515705108643, -5.430662155151367, 5, 1)
    this.addGrassPatch(26.84950065612793, 5.514446563720703, 1.0236713886260986, 3, 1)
    this.addGrassPatch(26.144351959228516, 5.514357395172119, 5.886881351470947, 3, 1)
    this.addGrassPatch(20.929555892944336, 5.514549560546875, 10.809517860412598, 5, 1)
    this.addGrassPatch(25.021854400634766, 5.514548130035401, 17.482690811157227, 4, 1)
    this.addGrassPatch(27.39418601989746, 5.514265842437744, 10.047652244567871, 2, 1)
    this.addGrassPatch(19.563457489013672, 5.514420337677002, -2.441600799560547, 4, 1)
    this.addGrassPatch(28.10930633544922, 5.514520950317383, -12.107354164123535, 3, 1)
    this.addGrassPatch(29.392362594604492, 5.514185733795166, 13.276251792907715, 2, 1)
    this.addGrassPatch(29.449871063232422, 5.514168567657471, 17.93047523498535, 2, 1)
    this.addGrassPatch(28.264358520507812, 5.51419813156128, 21.641324996948242, 2, 1)
    this.addGrassPatch(21.162128448486328, 5.514541454315186, 25.59329605102539, 5, 1)
    this.addGrassPatch(18.495929718017578, 5.514600105285645, 33.30531311035156, 5, 1)
    this.addGrassPatch(10.43803882598877, 5.5198929977416995, 41.90643310546875, 5, 1)
    this.addGrassPatch(18.565073013305664, 5.514536685943604, 45.84044647216797, 4, 1)
    this.addGrassPatch(13.492587089538574, 5.515666790008545, 47.45440673828125, 2, 1)
    this.addGrassPatch(17.314781188964844, 5.514512367248535, 21.242908477783203, 2, 1)
    this.addGrassPatch(14.169683456420898, 5.464258499145508, 22.51618194580078, 2, 1)
    this.addGrassPatch(14.296185493469238, 5.470246143341065, 29.3984317779541, 2.5, 1)
    this.addGrassPatch(18.01413917541504, 5.514479465484619, 16.034263610839844, 2, 1)
    this.addGrassPatch(17.87906265258789, 5.514492816925049, 18.84407615661621, 2, 1)
    this.addGrassPatch(21.48212432861328, 5.514608211517334, 20.125520706176758, 1, 1)
    this.addGrassPatch(27.048906326293945, 5.514244384765625, 24.157472610473633, 3, 1)
    this.addGrassPatch(26.714946746826172, 5.514250106811524, 23.546953201293945, 3, 1)
    this.addGrassPatch(26.962953567504883, 5.514287300109864, 38.911895751953125, 5, 1)
    this.addGrassPatch(26.06072235107422, 5.514271087646485, 32.19112014770508, 4, 1)
    this.addGrassPatch(23.27971076965332, 5.51434928894043, 45.796592712402344, 3, 1)
    this.addGrassPatch(22.374561309814453, 5.514387435913086, 42.245906829833984, 2, 1)
    this.addGrassPatch(21.84343910217285, 5.514443225860596, 37.261253356933594, 3, 1)
    this.addGrassPatch(15.176856994628906, 5.490576095581055, 38.47562789916992, 5, 1)
  }

}