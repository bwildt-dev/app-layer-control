import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { partial } from 'lodash'
import { List, Map } from 'immutable'

import Modal from '/components/common/Modal'
import {
	asyncRefreshState,
	asyncFetchDevice,
	selectDevice,
	reduceDevice,
} from '/routes/devices/actions'
import getSelectedDevice from '/routes/devices/selectors/getSelectedDevice'
import getNavigatableDevices from '/routes/devices/selectors/getNavigatableDevices'
import AsyncButton from '/components/common/AsyncButton'
import Navigation from '/routes/devices/components/Navigation'

import {
	SystemInfo,
	Logs,
	Applications,
	DeviceImages,
	DeviceGroups,
	Queue,
	Images,
} from './widgets'
import getAsyncState from '/store/selectors/getAsyncState'

class DeviceDetail extends PureComponent {
	componentDidUpdate (prevProps) {
		const previousId = prevProps.selectedDevice
			? prevProps.selectedDevice.get('deviceId')
			: undefined
		const currentId  = this.props.selectedDevice
			? this.props.selectedDevice.get('deviceId')
			: undefined

		if (previousId !== currentId) {
			this.props.reduceDevice(previousId)

			if (currentId) {
				this.props.asyncFetchDevice(currentId)
			}
		}
	}

	getDeviceSources () {
		return this.props.deviceSources.filter(source => source.get('entryInDetail'))
	}

	onRefreshState = async () => {
		this.props.asyncRefreshState(this.props.selectedDevice.get('deviceId'))
	}

	renderCursor () {
		const { selectedDevice } = this.props
		if (!selectedDevice) {
			return
		}

		const prev = this.props.navigation.get('previous')
		const next = this.props.navigation.get('next')

		return (
			<div className="btn-group">
				{prev ? (
					<Navigation deviceId={prev} onSelect={this.props.selectDevice} side="left" />
				) : null}

				{next ? (
					<Navigation deviceId={next} onSelect={this.props.selectDevice} side="right" />
				) : null}
			</div>
		)
	}

	renderContent () {
		const deviceId = this.props.selectedDevice.get('deviceId')

		if (!this.props.selectedDevice.has('connected')) {
			return (
				<div className="card-message">
					<span className="fas fa-stopwatch text-yellow mr-2" />
					Waiting for App Layer Agent to connect ...
				</div>
			)
		} else {
			return (
				<div className="row">
					<div className="col">
						<div className="row">
							<div className="col-12">
								{this.props.selectedDevice.getIn(['updateState', 'short'], '').match(/error/i) ? (
									<div className="row">
										<div className="col-12">
											<div className="alert alert-danger">
												<span className="fas fa-exclamation-triangle mr-2" />
												{this.props.selectedDevice.getIn(
													['updateState', 'long'],
													'No description available'
												)}
											</div>
										</div>
									</div>
								) : null}

								<div className="row">
									<div className="col-lg-4 mb-4">
										<div className="row">
											<div className="col-7">
												<h5>
													<span className="fad fa-id-badge pr-1" /> Board
												</h5>
											</div>
											<div className="col">
												<AsyncButton
													className="btn btn-light d-block mb-1 float-right"
													onClick={this.onRefreshState}
													busy={this.props.isRefreshingState}
												>
													<span className="fad fa-sync-alt mr-1" /> Refresh
												</AsyncButton>
											</div>
										</div>

										<hr className="mt-1 mb-2" />

										<SystemInfo
											selectedDevice={this.props.selectedDevice}
											deviceSources={this.getDeviceSources()}
										/>
									</div>

									<div className="col-lg-4 mb-4">
										<DeviceGroups selectedDevice={this.props.selectedDevice} />
									</div>

									<div className="col-lg-4 mb-4">
										<div className="row">
											<div className="col-12">
												<Logs deviceId={deviceId} />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="row">
							<div className="col-12">
								<div className="row">
									<div className="col-lg-12 mb-4">
										<Applications
											containers={this.props.selectedDevice.get('containers')}
											selectedDevice={this.props.selectedDevice}
										/>
									</div>
								</div>
								<div className="row">
									<div className="col-lg-12 mb-4">
										<Queue selectedDevice={this.props.selectedDevice} />
									</div>
								</div>
							</div>
						</div>

						<div className="row">
							<div className="col-12">
								{Map.isMap(this.props.selectedDevice.get('images', List()).first()) ? (
									<DeviceImages
										images={this.props.selectedDevice.get('images')}
										selectedDevice={deviceId}
									/>
								) : (
									<Images images={this.props.selectedDevice.get('images')} />
								)}
							</div>
						</div>
					</div>
				</div>
			)
		}
	}

	render () {
		const status          = this.props.selectedDevice
			? this.props.selectedDevice.get('connected')
				? 'online'
				: 'offline'
			: undefined
		const title           = this.props.selectedDevice
			? `Device: ${this.props.selectedDevice.get('deviceId')}`
			: ''
		const headerClassName = status ? `device-${status}` : ''

		return (
			<Modal
				title={title}
				cursor={this.renderCursor()}
				headerClassName={headerClassName}
				visible={this.props.open}
				onClose={partial(this.props.selectDevice, null)}
				wide
			>
				{this.props.selectedDevice ? this.renderContent() : null}
			</Modal>
		)
	}
}

export default connect(
	(state, ownProps) => {
		const selectedDevice = getSelectedDevice(state)

		return {
			navigation:        getNavigatableDevices(state),
			selectedDevice:    selectedDevice,
			isRefreshingState: getAsyncState([
				'isRefreshingState',
				ownProps.open && selectedDevice.get('deviceId'),
			])(state),
		}
	},
	{
		asyncRefreshState,
		asyncFetchDevice,
		selectDevice,
		reduceDevice,
	}
)(DeviceDetail)
