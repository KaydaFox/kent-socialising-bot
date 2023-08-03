import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { envParseString } from '@skyra/env-utilities';
import { EmbedBuilder, type ModalSubmitInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ModalHandler extends InteractionHandler {
	public override parse(interaction: ModalSubmitInteraction) {
		const interactionData = interaction.customId.split('.');
		// ban[0].modal[1].<userId>[2]
		if (interactionData[0] !== 'ban') return this.none();

		return this.some(interactionData[2]);
	}

	public async run(interaction: ModalSubmitInteraction, userId: string) {
		try {
			const reason = interaction.fields.getTextInputValue('ban.reasonInput');

			const didSendDm = await this.container.client.utilities.modlogUtilities.sendDmToUser(
				userId,
				new EmbedBuilder()
					.setAuthor({
						name: interaction.guild?.name || 'Kent socialising',
						iconURL: interaction.guild?.iconURL() || undefined
					})
					.setDescription('You were banned from the server')
					.addFields({
						name: 'Reason',
						value: reason ?? 'No reason provided'
					})
			);

			await this.container.client.guilds.cache
				.get(envParseString('GUILD_ID'))
				?.members.ban(userId, { reason: `${reason} - Banned by (${interaction.user.tag})` ?? 'No reason provided' });

			return interaction.reply({
				content: `Successfully banned <@${userId}>. ${didSendDm ? 'They were also sent a DM' : 'I could not send them a DM'}`,
				ephemeral: true
			});
		} catch (error) {
			this.container.logger.error(error);
			return interaction.reply({ content: 'An error occurred while banning the user, please ban them yourself', ephemeral: true });
		}
	}
}