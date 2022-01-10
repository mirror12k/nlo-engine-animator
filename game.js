
var game;


function UserInputService() {
	Entity.call(this, game);
	this.add_entity(this.rotation_thing = new ScreenEntity(game, -100,-100, 32, 32, game.images.rotate_icon));
	this.add_entity(this.frame_display = new FrameDisplay(100,30));
	this.rotation_thing.active = false;
	this.running_id = 1;

	this.step_index = 0;
	this.step_data = [[]];
	this.did_changes = false;
}
UserInputService.prototype = Object.create(Entity.prototype);
UserInputService.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);

	if (!game.previous_mouse1_state && game.mouse1_state) {
		// check if we clicked on a rotation handle
		if (this.interacting_ent && this.rotation_thing.contains_point(game.mouse_game_position)) {
			this.did_changes = true;

			// rotate it until the player releases the mouse button
			this.until(() => !game.mouse1_state, () => {
				// update angle
				this.interacting_ent.angle = -Math.atan2(this.interacting_ent.px - game.mouse_game_position.px, this.interacting_ent.py - game.mouse_game_position.py) / Math.PI * 180;
			});
		// check if we clicked on a draggable template or a draggable thing
		} else if (
				// try to find a template on the player's mouse click
				(this.templating_ent = game.find_at(SelectedThing, game.mouse_game_position))
				// or try to find an existing ent
				|| (this.interacting_ent = game.find_at(PlacableThing, game.mouse_game_position))) {

			this.did_changes = true;

			// if they clicked a template, clone it and drag it in
			if (this.templating_ent)
				game.add_entity(this.interacting_ent = new PlacableThing(this.running_id++, game.mouse_game_position.px, game.mouse_game_position.py, this.templating_ent.angle, this.templating_ent.image.dataset.url));

			// calculate the dragging offset
			var delta = { px: this.interacting_ent.px - game.mouse_game_position.px, py: this.interacting_ent.py - game.mouse_game_position.py };

			// drag it until the player releases the mouse button
			this.until(() => !game.mouse1_state, () => {
				this.interacting_ent.px = game.mouse_game_position.px + delta.px;
				this.interacting_ent.py = game.mouse_game_position.py + delta.py;
			});
		// otherwise clear selection
		} else {
			this.interacting_ent = undefined;
		}
	}

	if (game.is_key_pressed('S')) {
		if (this.did_changes)
			this.step_data[this.step_index] = this.save_all_data();
		this.did_changes = false;
		console.log("this.step_data:", JSON.stringify(this.step_data));
	}
	if (game.is_key_pressed('D')) {
		// console.log(JSON.stringify(this.step_data));
		if (this.did_changes)
			this.step_data[this.step_index] = this.save_all_data();
		this.did_changes = false;
		if (this.step_index >= this.step_data.length - 1) {
			this.step_data.push(this.step_data[this.step_index]);
		}
		this.step_index++;
		this.change_to_frame(this.step_index);
	}
	if (game.is_key_pressed('A')) {
		// console.log(JSON.stringify(this.step_data));
		if (this.did_changes)
			this.step_data[this.step_index] = this.save_all_data();
		this.did_changes = false;
		if (this.step_index === 0) {
			this.step_data.unshift(this.step_data[this.step_index]);
		} else {
			this.step_index--;
		}
		this.change_to_frame(this.step_index);
	}

	this.rotation_thing.active = !!this.interacting_ent;
	if (this.interacting_ent) {
		this.rotation_thing.angle = this.interacting_ent.angle;
		this.rotation_thing.px = this.interacting_ent.px + Math.sin(this.interacting_ent.angle / 180 * Math.PI) * (this.interacting_ent.height / 2 + this.rotation_thing.height / 2);
		this.rotation_thing.py = this.interacting_ent.py - Math.cos(this.interacting_ent.angle / 180 * Math.PI) * (this.interacting_ent.height / 2 + this.rotation_thing.height / 2);
	}
};
UserInputService.prototype.change_to_frame = function (step_index) {
	this.step_index = step_index;
	if (this.step_index < this.step_data.length) {
		this.reload_all_data(this.step_data[this.step_index]);
	}
}
UserInputService.prototype.save_all_data = function () {
	var data = game.entities.filter(e => e instanceof PlacableThing).map(e => [ e.id, e.px, e.py, Math.round(e.angle), e.image.dataset.url ]);
	// console.log("data:", data);
	return data;
}
UserInputService.prototype.reload_all_data = function (data) {

	var things = game.entities.filter(e => e instanceof PlacableThing);
	things.forEach(e => {
		var ent_data = data.find(d => d[0] === e.id);
		if (ent_data)
			e.set_data(...ent_data.slice(1));
		else {
			// game.remove_entity(e);
			// if (e === this.interacting_ent)
			// 	this.interacting_ent = undefined;
		}
	});
	for (var d of data.filter(d => !things.some(e => d[0] === e.id))) {
		game.add_entity(new PlacableThing(...d));
	}
}

function SelectedThing(px, py, image) {
	ScreenEntity.call(this, game, px, py, 32, 32, image);
	this.select_image(image);
}
SelectedThing.prototype = Object.create(ScreenEntity.prototype);
SelectedThing.prototype.select_image = function (image) {
	this.image = image;
	this.width = image.width;
	this.height = image.height;
}

// function RotationThing(px, py) {
// 	ScreenEntity.call(this, game, px, py, 32, 32, game.images.rotate_icon);
// }
// RotationThing.prototype = Object.create(ScreenEntity.prototype);

function PlacableThing(id, px, py, angle, image_url) {
	ScreenEntity.call(this, game, px, py, 16, 16, undefined);
	this.id = id;
	this.px = px;
	this.py = py;
	this.angle = angle;
	nlo.load.load_image_onpage(image_url, image => {
		this.image = image;
		this.width = image.width;
		this.height = image.height;
	});
	// this.set_data(px, py, angle, image_url);
}
PlacableThing.prototype = Object.create(ScreenEntity.prototype);
PlacableThing.prototype.set_data = function (px, py, angle, image_url) {
	// this.px = px;
	// this.py = py;
	// this.angle = angle;
	nlo.load.load_image_onpage(image_url, image => {
		this.image = image;
		this.width = image.width;
		this.height = image.height;
	});
	var startpx = this.px;
	var startpy = this.py;
	var startangle = this.angle;

	this.cancel_transistion(this.current_transition);
	this.current_transition = this.transition(1/12, f => {
		this.px = lerp(startpx, px, f);
		this.py = lerp(startpy, py, f);
		this.angle = lerp(startangle, angle, f);
	});
}
function FrameDisplay(px, py) {
	ScreenEntity.call(this, game, px, py, 1, 1, undefined);
}
FrameDisplay.prototype = Object.create(ScreenEntity.prototype);
FrameDisplay.prototype.draw = function (ctx) {
	ctx.save();
	ctx.translate(this.px, this.py);
	ctx.rotate(this.angle * Math.PI / 180);
	ctx.font = "30px Arial";
	ctx.fillStyle = '#000';
	ctx.fillText("frame " + (game.game_systems.user_input_service.step_index + 1) + " / " + game.game_systems.user_input_service.step_data.length, 0, 0);
	ctx.restore();
}




function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');
	// ctx.imageSmoothingEnabled = false;

	nlo.load.load_all_assets({
		images: {
			ufo: 'assets/img/ufo.png',

			body: 'assets/img/body.png',
			foot: 'assets/img/foot.png',
			gun: 'assets/img/gun.png',
			head: 'assets/img/head.png',
			rotate_icon: 'assets/img/rotate_icon.png',
		},
	}, loaded_assets => {
		game = new GameSystem(canvas, loaded_assets);
		game.background_color = '#fff';

		// initialize all systems
		game.game_systems.user_input_service = new UserInputService(game);

		// game.game_systems.turret_system.add_turret(game, 32,32);
		// game.game_systems.enemy_system.spawn_enemy(game, 640,64);

		game.add_entity(new SelectedThing(50, 50, game.images.head));
		game.add_entity(new SelectedThing(50, 125, game.images.body));
		game.add_entity(new SelectedThing(150, 150, game.images.gun));
		game.add_entity(new SelectedThing(50, 200, game.images.foot));
		// game.particle_systems.purple_particles = new ParticleEffectSystem(game, { fill_style: '#404', });

		game.run_game(ctx, 60);
	});
}

window.addEventListener('load', main);
